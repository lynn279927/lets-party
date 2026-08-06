'use strict';

(function () {
  var container;
  var inputEl;
  var noteEl; 
  var TAGS = ['火锅', '烧烤', '奶茶', '烤鱼', '披萨', '炒菜', '随便', '辣的'];

  function render() {
    container = document.getElementById('add-input');
    if (!container) return;

    container.innerHTML = '';
    container.className = 'add-input-container';

    /* 1. 标签行 (交互优化：点击只填入，不自动提交) */
    var tagContainer = document.createElement('div');
    tagContainer.className = 'add-input-tags';

    TAGS.forEach(function (tag) {
      var btn = document.createElement('button');
      btn.className = 'add-input-tag';
      btn.textContent = tag;
      btn.setAttribute('aria-label', '填入' + tag);
      
      // 核心改动：点击把字填进输入框，并光标聚焦，让用户写备注
      btn.addEventListener('click', function () {
        inputEl.value = tag;
        inputEl.focus(); // 聚焦到输入框
      });
      tagContainer.appendChild(btn);
    });

    container.appendChild(tagContainer);

    /* 2. 输入行 */
    var inputRow = document.createElement('div');
    inputRow.className = 'add-input-row';

    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'add-input-field';
    inputEl.placeholder = '✏️ 我想吃什么？';
    
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

    // 只有在点击“提交”按钮时才真正提交
    submitBtn.addEventListener('click', function () {
      submitDish(inputEl.value, noteEl.value);
    });

    inputRow.appendChild(submitBtn);
    container.appendChild(inputRow);
  }

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

    var dish = Models.createDish(
      Utils.generateId('dish'),
      name.trim(),
      currentUser.id,
      currentUser.name,
      (note || '').trim() 
    );

    window.Store.addDish(dish);
    Utils.showToast('已添加「' + dish.name + '」');
    
    inputEl.value = '';
    noteEl.value = '';
  }

  window.AddInput = {
    render: render,
  };
})();
