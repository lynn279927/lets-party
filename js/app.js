'use strict';

(function () {
  document.addEventListener('DOMContentLoaded', function () { init(); });

  function init() {
    var params = window.Router ? window.Router.parseUrlParams() : {};
    var gatheringId = params.gatheringId || window.Utils.generateId('g');
    
    if (!params.gatheringId && window.Router) {
      window.Router.redirectToGathering(gatheringId, '我的聚会');
    }

    var name = params.gatheringName || '我的聚会';

    // 1. 初始化同步
    if (window.Sync && window.FirebaseConfig) {
      window.Sync.init(gatheringId);
    }

    // 2. 设置聚会 & 加载本地缓存
    var storedDishes = window.Store._storage.getItem('dishapp_dishes_' + gatheringId);
    var g = window.Models.createGathering(gatheringId, decodeURIComponent(name));
    window.Store.setGathering(g);
    if (storedDishes) window.Store.loadFromStorage(gatheringId);

    // 3. 身份检查
    if (window.Store._state.user && window.Store._state.user.name) {
      showMainUI();
    } else {
      if (window.NicknameModal) {
        window.NicknameModal.show();
        window.NicknameModal.getUser().then(function(u) {
          window.Store.setUser(u); showMainUI();
        });
      }
    }

    // 4. 监听数据变化
    window.Store.subscribe(function (state, change) {
      // 🛡 核心修复：跳过 sync:restore 类型，避免云端同步回来又推回去造成死循环！
      if (window.Sync && change.type !== 'sync:restore') {
        window.Sync.push(state.dishes);
      }

      var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
      if (activeTab === 'menu' && window.MenuGenerator) {
        window.MenuGenerator.render(state.dishes);
      } else if (window.DishList) {
        window.DishList.render(activeTab);
      }
    });

    // 5. 🛡 缓存回传：如果有本地缓存，延迟 1 秒推送到云端（防止覆盖别人的新数据）
    if (storedDishes && window.Store.dishes.length > 0) {
      setTimeout(() => {
        window.Sync.push(window.Store._state.dishes);
      }, 1500);
    }

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
