'use strict';

window.Sync = {
  _channel: null,
  _supported: false,
  _firebase: null,
  _firebaseRef: null,
  _firebaseListener: null,
  _gatheringId: null,

  /* Initialize sync: Firebase (if configured) + BroadcastChannel fallback */
  init(gatheringId) {
    this._gatheringId = gatheringId;

    /* 1. Try Firebase first (cross-device) */
    if (this._initFirebase()) return;

    /* 2. Fallback: BroadcastChannel (same device, different tabs) */
    try {
      this._channel = new BroadcastChannel('dishapp_sync');
      this._supported = true;
      console.log('Sync: BroadcastChannel (local only)');
    } catch (e) {
      this._supported = false;
      console.warn('Sync: no sync method available');
    }
  },

  /* Initialize Firebase if config exists */
  _initFirebase() {
    if (typeof firebase === 'undefined') return false;

    var config = window.FirebaseConfig;
    if (!config) return false;

    try {
      firebase.initializeApp(config);
      this._firebase = firebase.database();
      this._supported = true;
      console.log('Sync: Firebase RTDB (cross-device)');
      return true;
    } catch (e) {
      console.warn('Sync: Firebase init failed, falling back:', e);
      return false;
    }
  },

  /* Broadcast a change — write to Firebase or postMessage */
  broadcast(change, dishesSnapshot) {
    if (this._firebase && this._gatheringId) {
      /* Write entire dishes state to Firebase for real-time sync */
      var path = 'gatherings/' + this._gatheringId + '/dishes';
      var ref = this._firebase.ref(path);
      var snapshot = dishesSnapshot || {};
      ref.set(snapshot)
        .catch(function (e) { console.warn('Firebase write failed:', e); });
      return;
    }

    /* Fallback: BroadcastChannel */
    if (this._channel) {
      try {
        this._channel.postMessage(change);
      } catch (e) {
        console.warn('Broadcast failed:', e);
      }
    }
  },

  /* Subscribe to remote changes */
  onMessage(callback) {
    if (this._firebase && this._gatheringId) {
      this._setupFirebaseListener(callback);
      return;
    }

    /* Fallback: BroadcastChannel */
    if (this._channel) {
      this._channel.onmessage = (e) => {
        if (e.data && e.data.type) {
          callback(e.data);
        }
      };
    }
  },

  /* Set up Firebase realtime listener */
  _setupFirebaseListener(callback) {
    var path = 'gatherings/' + this._gatheringId + '/dishes';
    var ref = this._firebase.ref(path);

    ref.on('value', (snapshot) => {
      var data = snapshot.val();
      if (!data) return;

      callback({
        type: 'firebase:sync',
        dishes: data,
      });
    }, (error) => {
      console.error('Firebase listener error:', error);
    });

    this._firebaseRef = ref;
  },

  /* Apply a remote change to the store's dishes state */
  applyRemoteChange(store, change) {
    if (!store) return;

    /* Firebase sync: replace dishes entirely from server */
    if (change.type === 'firebase:sync' && change.dishes) {
      store._state.dishes = change.dishes;
      return;
    }

    /* BroadcastChannel fallback */
    if (change.type === 'dish:add' && change.dish) {
      store._state.dishes[change.dish.id] = change.dish;
    } else if (change.type === 'dish:remove' && change.id) {
      delete store._state.dishes[change.id];
    } else if (change.type === 'dish:vote' || change.type === 'dish:unvote' ||
               change.type === 'dish:star' || change.type === 'dish:unstar') {
      if (store._state.gathering) {
        store.loadFromStorage(store._state.gathering.id);
      }
    }
  },

  /* Close connections */
  destroy() {
    /* Detach Firebase listener */
    if (this._firebaseRef) {
      try {
        this._firebaseRef.off();
      } catch (e) { /* ignore */ }
      this._firebaseRef = null;
    }

    /* Close BroadcastChannel */
    if (this._channel) {
      this._channel.close();
      this._channel = null;
      this._supported = false;
    }
  },

  /* Check if Firebase sync is active */
  isFirebaseActive() {
    return !!this._firebase;
  },
};
