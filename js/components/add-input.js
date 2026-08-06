'use strict';

(function () {
  var container;
  var inputEl;
  var noteEl; // 新增：备注输入框
  var duplicateHint;
  var tagContainer;
  var TAGS = ['火锅', '烧烤', '奶茶', '烤鱼', '披萨', '炒菜', '随便', '辣的'];

  function render() {
    container = document.getElementById('add-input');
    if (!container) return;

    container.innerHTML = '';
    container.className = 'add-input-container';

    /* 1. 标签行 */
    tagContainer = document.createElement('div');
    tagContainer.className = 'add-input-tags';

    TAGS.forEach(function (tag) {
      var btn = document.createElement('button');
      btn.className = 'add-input-tag';
      btn.textContent = tag;
      btn.setAttribute('aria-label', '快速添加' + tag);
      // 点击标签直接提交，备注为空
      btn.addEventListener('click', function () {
        submitDish(tag, '');
      });
      tagContainer.appendChild(btn);
    });

    container.appendChild(tagContainer);

    /* 2. 输入行 */
    var inputRow = document.createElement('div');
    inputRow.className = 'add-input-row';

    // 菜名输入
    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'add-input-field';
    inputEl.placeholder = '✏️ 我想吃什么？';
    
    // 新增：备注输入框
    noteEl = document.createElement('input');
    noteEl.type = 'text';
    noteEl.className = 'add-input-note';
    noteEl.placeholder = '📝 备注 (如：不吃辣/少盐)';
    noteEl.style.cssText = 'display:block; width:100%; height:30px; margin-top:4px; font-size:13px; padding:0 8px; border:1px dashed #bbb; border-radius:12px;';

    var inputGroup = document.createElement('div');
    inputGroup.style.flex = '1';
    inputGroup.appendChild(inputEl);
    inputGroup.appendChild(noteEl);
    inputRow.appendChild(inputGroup);

    // 提交按钮
    var submitBtn = document.createElement('button');
    submitBtn.className = 'add-input-submit';
    submitBtn.textContent = '提交';

    submitBtn.addEventListener('click', function () {
      submitDish(inputEl.value, noteEl.value);
    });

    inputRow.appendChild(submitBtn);
    container.appendChild(inputRow);
  }

  // 统一提交逻辑
  function submitDish(name, note) {
    if (!name || !name.trim()) {
      Utils.showToast('请输入菜名');
      return;
    }

    var currentUser = window.Store._state.user;
    if (!currentUser) return;
    if (!window.Store.canPropose(currentUser.id)) {
      Utils.showToast('每人最多提5个菜哦');
      return;
    }

    // 将备注传入 createDish
    var dish = Models.createDish(
      Utils.generateId('dish'),
      name.trim(),
      currentUser.id,
      currentUser.name,
      (note || '').trim() 
    );

    window.Store.addDish(dish);
    Utils.showToast('已添加「' + dish.name + '」');
    
    // 清空输入框
    inputEl.value = '';
    noteEl.value = '';
  }

  // 对外暴露接口
  window.AddInput = {
    render: render,
  };
})();
