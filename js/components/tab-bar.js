'use strict';

(function () {
  var tabBarEl;
  var activeTab = 'all';
  var scrollPositions = { all: 0, hot: 0, mine: 0 };
  var onChangeCallback = null;

  var TABS = [
    { key: 'all', label: '全部' },
    { key: 'hot', label: '\uD83D\uDD25\uFE0F 热门' },
    { key: 'mine', label: '我的' },
  ];

  function render() {
    tabBarEl = document.getElementById('tab-bar');
    if (!tabBarEl) return;

    tabBarEl.innerHTML = '';

    TABS.forEach(function (tab) {
      var btn = document.createElement('button');
      btn.className = 'tab-btn' + (tab.key === activeTab ? ' active' : '');
      btn.textContent = tab.label;
      btn.setAttribute('data-tab', tab.key);
      btn.setAttribute('aria-label', tab.label + '标签');
      btn.addEventListener('click', function () {
        switchTab(tab.key);
      });
      tabBarEl.appendChild(btn);
    });
  }

  function switchTab(key) {
    if (key === activeTab) return;

    /* Save current scroll position */
    var dishList = document.getElementById('dish-list');
    if (dishList) {
      scrollPositions[activeTab] = dishList.scrollTop;
    }

    activeTab = key;
    render();

    /* Restore scroll position */
    if (dishList) {
      dishList.scrollTop = scrollPositions[activeTab] || 0;
    }

    if (onChangeCallback) {
      onChangeCallback(activeTab);
    }
  }

  window.TabBar = {
    render: render,
    onChange: function (callback) {
      onChangeCallback = callback;
    },
    getActiveTab: function () {
      return activeTab;
    },
  };
})();
