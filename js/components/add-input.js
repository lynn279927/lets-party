'use strict';

(function () {
  var container;
  var tagContainer;
  var inputEl;
  var duplicateHint;
  var inputFocused = false;

  var TAGS = ['火锅', '烧烤', '奶茶', '烤鱼', '披萨', '炒菜', '随便', '辣的'];

  function render() {
    container = document.getElementById('add-input');
    if (!container) return;

    container.innerHTML = '';
    container.className = 'add-input-container';

    /* Tag row */
    tagContainer = document.createElement('div');
    tagContainer.className = 'add-input-tags';

    TAGS.forEach(function (tag) {
      var btn = document.createElement('button');
      btn.className = 'add-input-tag';
      btn.textContent = tag;
      btn.dataset.tag = tag;
      btn.setAttribute('aria-label', '快速添加' + tag);
      btn.addEventListener('click', function () {
        var currentUser = window.Store._state.user;
        if (!currentUser) return;
        if (!window.Store.canPropose(currentUser.id)) {
          Utils.showToast('每人最多提5个菜哦');
          return;
        }
        var dish = Models.createDish(
          Utils.generateId('dish'),
          tag,
          currentUser.id,
          currentUser.name
        );
        window.Store.addDish(dish);
        Utils.showToast('已添加「' + tag + '」');
      });
      tagContainer.appendChild(btn);
    });

    container.appendChild(tagContainer);

    /* Duplicate hint (hidden by default) */
    duplicateHint = document.createElement('div');
    duplicateHint.className = 'add-input-duplicate-hint';
    duplicateHint.style.display = 'none';
    container.appendChild(duplicateHint);

    /* Input row */
    var inputRow = document.createElement('div');
    inputRow.className = 'add-input-row';

    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'add-input-field';
    inputEl.placeholder = '\u270F\uFE0F 我想吃什么？';
    inputEl.setAttribute('aria-label', '输入你想吃的菜');

    var submitBtn = document.createElement('button');
    submitBtn.className = 'add-input-submit';
    submitBtn.textContent = '提交';

    submitBtn.addEventListener('click', onSubmit);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onSubmit();
    });

    /* Focus detection for tag collapse */
    inputEl.addEventListener('focus', function () {
      inputFocused = true;
      tagContainer.classList.add('collapsed');
    });
    inputEl.addEventListener('blur', function () {
      inputFocused = false;
      setTimeout(function () {
        tagContainer.classList.remove('collapsed');
      }, 200);
    });

    /* Real-time duplicate detection with debounce */
    inputEl.addEventListener('input', Utils.debounce(function () {
      checkDuplicates();
    }, 300));

    inputRow.appendChild(inputEl);
    inputRow.appendChild(submitBtn);
    container.appendChild(inputRow);
  }

  function onSubmit() {
    if (!inputEl) return;

    var val = inputEl.value.trim();
    if (!val) {
      Utils.showToast('请输入菜名');
      return;
    }

    var currentUser = window.Store._state.user;
    if (!currentUser) return;
    if (!window.Store.canPropose(currentUser.id)) {
      Utils.showToast('每人最多提5个菜哦');
      return;
    }

    var dish = Models.createDish(
      Utils.generateId('dish'),
      val,
      currentUser.id,
      currentUser.name
    );

    window.Store.addDish(dish);
    Utils.showToast('已添加「' + val + '」');
    inputEl.value = '';
    hideDuplicateHint();
  }

  function checkDuplicates() {
    if (!inputEl || !window.Store) return;

    var val = inputEl.value.trim();
    if (!val) {
      hideDuplicateHint();
      return;
    }

    var dishes = window.Store.dishes;
    var match = null;
    for (var i = 0; i < dishes.length; i++) {
      if (dishes[i].status === 'active' && Utils.isSimilar(val, dishes[i].name, 0.6)) {
        match = dishes[i];
        break;
      }
    }

    if (match) {
      showDuplicateHint(match);
    } else {
      hideDuplicateHint();
    }
  }

  function showDuplicateHint(dish) {
    if (!duplicateHint) return;
    duplicateHint.style.display = 'block';
    duplicateHint.innerHTML =
      '已有「' + Utils.escapeHtml(dish.name) + '」' +
      ' <button class="hint-btn hint-go" data-dishid="' + dish.id + '">去投票</button>' +
      ' <button class="hint-btn hint-add">仍要添加</button>';

    var goBtn = duplicateHint.querySelector('.hint-go');
    var addBtn = duplicateHint.querySelector('.hint-add');

    if (goBtn) {
      goBtn.addEventListener('click', function () {
        var currentUser = window.Store._state.user;
        if (currentUser) window.Store.vote(dish.id, currentUser.id);
        hideDuplicateHint();
        if (inputEl) inputEl.value = '';
        Utils.showToast('已投票');
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        hideDuplicateHint();
        onSubmit();
      });
    }
  }

  function hideDuplicateHint() {
    if (duplicateHint) {
      duplicateHint.style.display = 'none';
      duplicateHint.innerHTML = '';
    }
  }

  window.AddInput = {
    render: render,
  };
})();
