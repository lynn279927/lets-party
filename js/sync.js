'use strict';
/* Firebase 实时同步模块 */
window.Sync = {
  _gatheringId: null,
  _ref: null,

  /**
   * 初始化同步
   * 参数：gatheringId (聚会名称/ID)
   */
  init(gatheringId) {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded. Sync disabled.');
      return;
    }

    this._gatheringId = gatheringId;
    
    // 初始化 Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(window.FirebaseConfig);
    }
    var db = firebase.database();
    
    // 定位到当前聚会的"菜品"节点
    this._ref = db.ref('gatherings/' + this._gatheringId + '/dishes');

    // 监听云端变化：一旦云端数据变了，立即同步到本地 Store
    this._ref.on('value', (snapshot) => {
      var data = snapshot.val();
      if (data && window.Store) {
        // 覆盖本地数据并触发界面刷新
        window.Store.restoreDishes(data);
      }
    }, (error) => {
      console.error("Sync Error: " + error.code);
    });

    console.log('Sync: Connected to "' + this._gatheringId + '" via Firebase');
  },

  /**
   * 推送数据到云端
   * 当用户在本地添加/删除/修改菜品时调用此方法
   */
  push(dishes) {
    if (this._ref) {
      // 把整个菜品字典写入云端
      this._ref.set(dishes);
    }
  },

  destroy() {
    if (this._ref) this._ref.off();
  },
  
  isFirebaseActive() { return true; }
};
