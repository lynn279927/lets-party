'use strict';

(function () {
  /* 等待页面加载完成 */
  document.addEventListener('DOMContentLoaded', function () {
    init();
  });

  function init() {
    // 1. 获取聚会 ID (从网址或生成新的)
    var params = window.Router ? window.Router.parseUrlParams() : {};
    var gatheringId = params.gatheringId || window.Utils.generateId('g');
    
    if (!params.gatheringId && window.Router) {
      window.Router.redirectToGathering(gatheringId, '我的聚会');
    }

    var name = params.gatheringName || '我的聚会';

    // 2. 核心修复：先初始化同步，确保连接云端
    if (window.Sync && window.FirebaseConfig) {
      console.log('Sync Initializing with:', gatheringId);
      window.Sync.init(gatheringId);
    }

    // 3. 设置聚会信息
    var storedDishes = window.Store._storage.getItem('dishapp_dishes_' + gatheringId);
    var g = window.Models.createGathering(gatheringId, decodeURIComponent(name));
    window.Store.setGathering(g);
    
    // 尝试加载本地缓存
    if (storedDishes) window.Store.loadFromStorage(gatheringId);

    // 4. 检查用户身份 (没名字不让进)
    if (window.Store._state.user && window.Store._state.user.name) {
      showMainUI();
    } else {
      if (window.NicknameModal) {
        window.NicknameModal.show();
        window.NicknameModal.getUser().then(function(user) {
          window.Store.setUser(user);
          showMainUI();
        });
      }
    }

    // 5. 监听数据变化 -> 同步到云端 & 刷新界面
    window.Store.subscribe(function (state, change) {
      // A. 推送数据到 Firebase
      if (window.Sync) window.Sync.push(state.dishes);

      // B. 根据当前 Tab 刷新界面
      var activeTab = window.TabBar ? window.TabBar.getActiveTab() : 'all';
      
      // 检查是否有智能菜单生成器
      if (activeTab === 'menu' && window.MenuGenerator) {
        window.MenuGenerator.render(state.dishes);
      } else if (window.DishList) {
        window.DishList.render(activeTab);
      }
    });

    // 6. 切换 Tab 逻辑
    if (window.TabBar) {
      window.TabBar.onChange(function (tab) {
        if (tab === 'menu' && window.MenuGenerator) {
          window.MenuGenerator.render(window.Store.dishes);
        } else if (window.DishList) {
          window.DishList.render(tab);
        }
      });
    }
  }

  function showMainUI() {
    if (window.GatheringHeader) window.GatheringHeader.render(window.Store._state.gathering);
    if (window.TabBar) window.TabBar.render();
    if (window.DishList) window.DishList.render('all');
    if (window.AddInput) window.AddInput.render();
  }
})();
