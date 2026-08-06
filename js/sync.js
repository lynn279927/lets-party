'use strict';
/* Firebase 实时同步模块 (已修复：防止空数据清空本地) */
window.Sync = {
  _gatheringId: null,
  _ref: null,

  init(gatheringId) {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded. Sync disabled.');
      return;
    }

    this._gatheringId = gatheringId;
    
    if (!firebase.apps.length) {
      firebase.initializeApp(window.FirebaseConfig);
    }
    var db = firebase.database();
    this._ref = db.ref('gatherings/' + this._gatheringId + '/dishes');

    // 监听云端变化
    this._ref.on('value', (snapshot) => {
      var data = snapshot.val();
      // 🛡 核心修复：只有云端真的有数据时，才覆盖本地！
      // 避免网络延迟或空数据把本地缓存刷没了
      if (data && window.Store && Object.keys(data).length > 0) {
        window.Store.restoreDishes(data);
      }
    }, (error) => {
      console.error("Sync Error: " + error.code);
    });

    console.log('Sync: Connected to "' + this._gatheringId + '" via Firebase');
  },

  push(dishes) {
    if (this._ref) {
      this._ref.set(dishes);
    }
  },

  destroy() {
    if (this._ref) this._ref.off();
  },
  
  isFirebaseActive() { return true; }
};
