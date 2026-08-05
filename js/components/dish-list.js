'use strict';

(function () {
  var listEl;

  var EMPTY_MESSAGES = {
    all: '还没有人提议吃什么，快来提一个吧！',
    hot: '还没有热门菜品哦，先投几票吧',
    mine: '你还没有提议任何菜品',
  };

  function render(tab) {
    listEl = document.getElementById('dish-list');
    if (!listEl) return;

    tab = tab || 'all';
    var dishes = window.Store.getDishesFiltered(tab);
    var currentUser = window.Store._state.user;

    listEl.innerHTML = '';

    if (dishes.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = EMPTY_MESSAGES[tab] || '暂无内容';
      listEl.appendChild(empty);
      return;
    }

    /* Use DocumentFragment for batches > 30 */
    var fragment = document.createDocumentFragment();
    var useFragment = dishes.length > 30;

    dishes.forEach(function (dish) {
      var card = DishCard.createElement(dish, currentUser);
      if (useFragment) {
        fragment.appendChild(card);
      } else {
        listEl.appendChild(card);
      }
    });

    if (useFragment) {
      listEl.appendChild(fragment);
    }
  }

  window.DishList = {
    render: render,
  };
})();
