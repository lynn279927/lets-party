'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () { init(); });

  function init() {
    /* 1. 获取聚会 ID */
    var params = window.Router ? window.Router.parseUrlParams() : {};
    var gatheringId = params.gatheringId || window.Utils.generateId('g');
    
    if (!params.gatheringId && window.Router) {
      window.Router.redirectToGathering(gatheringId, '我的聚会');
    }
    var name = params.gatheringName || '我的聚会';

    /* 2. 初始化同步 (连接 Firebase) */
    if (window.Sync && window.FirebaseConfig) {
      window.Sync.init(gatheringId);
    }

    /* 3. 加载本地缓存！(这步是为了找回你之前提的菜) */
    var storedDishes = window.Store._storage.getItem('dishapp_dishes_' + gatheringId);
    var hasLocalData = false;
    
    if (storedDishes) {
      try {
         var local = JSON.parse(storedDishes);
         if (Object.keys(local).length > 0) hasLocalData = true; // 确实有菜
      } catch(e) {}
    }
    
    // 先加载到内存
    var g = window.Models.createGathering(gatheringId, decodeURIComponent(name));
    window.Store.setGathering(g);
    if (hasLocalData) {
        window.Store.loadFromStorage(gatheringId);
        console.log('Local cache loaded: ' + window.Store.dishes.length + ' dishes.');
    }

    /* 4. 身份检查 */
    if (window.Store._state.user && window.Store._state.user.name) {
      showMainUI();
    } else {
      if (window.NicknameModal) {
        window.NicknameModal.show();
        window.NicknameModal.getUser().then((u) => {
          window.Store.setUser(u);
          showMainUI();
        });
      }
    }

    /* 5. 监听变化：只有“新增/删除”时才推送到云端 */
    window.Store.subscribe(function (state, change) {
      // 🛡 保护：如果本地是空的，千万别推送！
      if (window.Sync && window.Store.dishes.length === 0) return;

      // 🛡 保护：如果是刚刚从云端同步回来的数据，别推回去（防死循环）
      if (change && change.type === 'sync:restore') return;

      console.log('Pushing to cloud...');
      window.Sync.push(state.dishes);

      // 刷新 UI
      var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
      if (activeTab === 'menu' && window.MenuGenerator) {
        window.MenuGenerator.render(state.dishes);
      } else if (window.DishList) {
        window.DishList.render(activeTab);
      }
    });

    /* 6. 关键：如果有本地缓存，延迟 2 秒强行推送到云端 */
    // (这能解决 Firebase 加载慢导致的数据丢失问题)
    if (hasLocalData) {
      console.log('Scheduling local data restore to Cloud...');
      setTimeout(() => {
        if (window.Store && window.Store.dishes.length > 0 && window.Sync) {
             window.Sync.push(window.Store._state.dishes);
        }
      }, 2000);
    }

    /* 7. Tab 切换 */
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

  function showMainUI() {
    if (window.GatheringHeader) window.GatheringHeader.render(window.Store._state.gathering);
    if (window.TabBar) window.TabBar.render();
    if (window.DishList) window.DishList.render('all');
    if (window.AddInput) window.AddInput.render();
  }
})();
