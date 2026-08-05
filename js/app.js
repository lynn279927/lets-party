'use strict';

(function () {
  /* Wait for DOM */
  document.addEventListener('DOMContentLoaded', function () {
    init();
  });

  function init() {
    /* 1. 第一步：解析 URL，确定房间号 (gatheringId) */
    var params = window.Router.parseUrlParams();
    var gatheringId;

    if (params.gatheringId) {
      gatheringId = params.gatheringId;
    } else {
      var newId = window.Utils.generateId('g');
      var autoName = '我的聚会';
      window.Router.redirectToGathering(newId, autoName);
      gatheringId = newId;
    }

    /* 2. 第二步：先建立同步通道 (修复核心 Bug) */
    window.Sync.init(gatheringId);

    /* 3. 第三步：再加载/创建聚会数据 */
    var name = params.gatheringName || params.gatheringId;
    var storedDishes = window.Store._storage.getItem('dishapp_dishes_' + gatheringId);
    
    var g;
    if (storedDishes) {
      window.Store.loadFromStorage(gatheringId);
      g = {
        id: gatheringId,
        name: decodeURIComponent(name),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      };
    } else {
      g = window.Models.createGathering(gatheringId, decodeURIComponent(name || gatheringId));
    }
    window.Store.setGathering(g);

    /* 4. 处理本地存储警告 */
    if (!window._isStorageAvailable) {
      var banner = document.createElement('div');
      banner.className = 'warning-banner';
      banner.textContent = '\u26A0\uFE0F 数据仅在当前页面有效，关闭后丢失';
      document.body.insertBefore(banner, document.body.firstChild);
    }

    /* 5. 检查用户身份 */
    var storedUser = window.Store._state.user;
    if (storedUser && storedUser.name) {
      showMainUI(window.Sync.isFirebaseActive());
    } else {
      window.NicknameModal.show();
      window.NicknameModal.getUser().then(function (user) {
        window.Store.setUser(user);
        showMainUI(window.Sync.isFirebaseActive());
      });
    }

    /* 6. 监听远程数据变化 */
    window.Sync.onMessage(function (change) {
      window.Sync.applyRemoteChange(window.Store, change);
      var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
      if (window.DishList) window.DishList.render(activeTab);
    });

    /* 7. 页面可见性更新 */
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        var gathering = window.Store._state.gathering;
        if (gathering) {
          window.Store.loadFromStorage(gathering.id);
          var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
          if (window.DishList) window.DishList.render(activeTab);
        }
      }
    });

    /* 8. 清理 */
    window.addEventListener('beforeunload', function () {
      window.Sync.destroy();
    });
  }

  function showMainUI(isCrossDevice) {
    var gathering = window.Store._state.gathering;
    if (gathering) {
      window.GatheringHeader.render(gathering);
    }
    window.TabBar.render();
    window.DishList.render('all');
    window.AddInput.render();

    window.Store.subscribe(function (state, change) {
      var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
      if (window.DishList) {
        window.DishList.render(activeTab);
      }
      if (window.AddInput && (change.type === 'dish:add' || change.type === 'dish:remove')) {
        window.AddInput.render();
      }
    });

    window.TabBar.onChange(function (tab) {
      window.DishList.render(tab);
    });
  }
})();
