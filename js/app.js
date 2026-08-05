'use strict';

(function () {
  /* Wait for DOM */
  document.addEventListener('DOMContentLoaded', function () {
    init();
  });

  function init() {
    /* 1. Parse URL and determine gatheringId */
    var params = window.Router.parseUrlParams();
    var gatheringId;

    if (params.gatheringId) {
      gatheringId = params.gatheringId;
      var name = params.gatheringName || params.gatheringId;

      /* Try to recover from localStorage first */
      var storedDishes = window.Store._storage.getItem('dishapp_dishes_' + gatheringId);
      if (storedDishes) {
        window.Store.loadFromStorage(gatheringId);
        var g = {
          id: gatheringId,
          name: decodeURIComponent(name),
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        };
        window.Store.setGathering(g);
      } else {
        var g = window.Models.createGathering(gatheringId, decodeURIComponent(name));
        window.Store.setGathering(g);
      }
    } else {
      /* No gatheringId → auto-create one */
      var newId = window.Utils.generateId('g');
      var autoName = '我的聚会';
      var g = window.Models.createGathering(newId, autoName);
      window.Store.setGathering(g);
      window.Router.redirectToGathering(newId, autoName);
      gatheringId = newId;
    }

    /* 2. Init sync with gatheringId (enables Firebase if configured) */
    window.Sync.init(gatheringId);

    /* 3. Handle storage unavailable warning */
    if (!window._isStorageAvailable) {
      showStorageWarning();
    }

    /* 4. Show Firebase sync indicator */
    var isCrossDevice = window.Sync.isFirebaseActive();

    /* 5. Check or prompt for user */
    var storedUser = window.Store._state.user;
    if (storedUser && storedUser.name) {
      showMainUI(isCrossDevice);
    } else {
      window.NicknameModal.show();
      window.NicknameModal.getUser().then(function (user) {
        window.Store.setUser(user);
        showMainUI(isCrossDevice);
      });
    }

    /* 6. Listen for remote changes (Firebase or BroadcastChannel) */
    window.Sync.onMessage(function (change) {
      window.Sync.applyRemoteChange(window.Store, change);
      var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
      if (window.DishList) window.DishList.render(activeTab);
    });

    /* 7. Visibility change — refresh from storage */
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

    /* 8. Cleanup on unload */
    window.addEventListener('beforeunload', function () {
      window.Sync.destroy();
    });
  }

  function showStorageWarning() {
    var banner = document.createElement('div');
    banner.className = 'warning-banner';
    banner.textContent = '\u26A0\uFE0F 数据仅在当前页面有效，关闭后丢失';
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function showMainUI(isCrossDevice) {
    var gathering = window.Store._state.gathering;
    if (gathering) {
      window.GatheringHeader.render(gathering);
    }
    window.TabBar.render();
    window.DishList.render('all');
    window.AddInput.render();

    /* Subscribe to store changes — re-render list */
    window.Store.subscribe(function (state, change) {
      var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
      if (window.DishList) {
        window.DishList.render(activeTab);
      }
      if (window.AddInput && (change.type === 'dish:add' || change.type === 'dish:remove')) {
        window.AddInput.render();
      }
    });

    /* Tab change handler */
    window.TabBar.onChange(function (tab) {
      window.DishList.render(tab);
    });
  }
})();
