'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () { init(); });

  function init() {
    /* 1. 获取聚会 ID */
    var params = window.Router ? window.Router.parseUrlParams() : {};
    var gatheringId = params.gatheringId || window.Utils.generateId('g');
    
    if (!params.gatheringId && window.Router) {
      window.Router.redirectToGathering(gatheringId, '我的聚会');
      return; 
    }
    var name = params.gatheringName || '我的聚会';

    /* 2. 关键修复：无条件加载本地记忆！ */
    // 无论有没有云端数据，先恢复手机里存的"我是谁"和"我提过什么菜"
    var g = window.Models.createGathering(gatheringId, decodeURIComponent(name));
    window.Store.setGathering(g);
    window.Store.loadFromStorage(gatheringId); 
    
    // 记录一下本地是否有数据，用于后面恢复上云
    var recoveredLocalDishes = window.Store.dishes.length > 0; 

    /* 3. 初始化同步 (连接 Firebase) */
    if (window.Sync && window.FirebaseConfig) {
      window.Sync.init(gatheringId);
    }

    /* 4. 身份检查 & 界面显示 */
    // 如果本地有存档，直接用；没有才弹窗问名字
    if (window.Store._state.user && window.Store._state.user.name) {
      console.log('👋 欢迎回来: ' + window.Store._state.user.name);
      showMainUI();
      
      // 🔥 核心：如果有本地缓存，延迟推送到云端，恢复数据
      if (recoveredLocalDishes) {
        recoverDataToCloud();
      }
    } else {
      if (window.NicknameModal) {
        window.NicknameModal.show();
        window.NicknameModal.getUser().then(function(u) {
          window.Store.setUser(u);
          showMainUI();
          // 同样尝试恢复缓存
          if (recoveredLocalDishes) {
             recoverDataToCloud();
          }
        });
      }
    }

    /* 5. 监听数据变动 */
    window.Store.subscribe(function (state, change) {
      // 防止云端回传的数据再次被推送回去造成死循环
      if (change && change.type === 'sync:restore') return;

      // 🛡 保护：如果本地是空的，不推送到云端（防止清空云端）
      if (window.Sync && window.Store.dishes.length === 0) return;

      console.log('☁️ 同步到云端...');
      window.Sync.push(state.dishes);

      // 刷新 UI
      var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
      if (activeTab === 'menu' && window.MenuGenerator) {
        window.MenuGenerator.render(state.dishes);
      } else if (window.DishList) {
        window.DishList.render(activeTab);
      }
    });

    /* 6. Tab 切换 */
    if (window.TabBar) {
      window.TabBar.onChange(function (tab) {
        if (tab === 'menu' && window.MenuGenerator) {
          window.MenuGenerator.render(window.Store.dishes);
        } else if (window.DishList) {
          window.DishList.render(tab);
        }
      });
    }

    window.addEventListener('beforeunload', () => window.Sync.destroy());
  }

  // 辅助函数：把本地缓存“搬运”上云
  function recoverDataToCloud() {
    if (window.Sync && window.Store.dishes.length > 0) {
      setTimeout(() => {
        console.log('💾 正在恢复本地缓存到云端...');
        window.Sync.push(window.Store._state.dishes);
      }, 2000); // 延迟 2 秒确保网络连接成功
    }
  }

  function showMainUI() {
    if (window.GatheringHeader) window.GatheringHeader.render(window.Store._state.gathering);
    if (window.TabBar) window.TabBar.render();
    if (window.DishList) window.DishList.render('all');
    if (window.AddInput) window.AddInput.render();
  }
})();
