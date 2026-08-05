'use strict';

(function () {
  var container;

  /* Build modal DOM */
  function buildModal() {
    container = document.getElementById('nickname-modal-container');
    container.innerHTML = '';

    var overlay = document.createElement('div');
    overlay.className = 'nickname-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'nickname-modal';

    var title = document.createElement('div');
    title.className = 'nickname-modal-title';
    title.textContent = '\uD83D\uDC4B\uFE0F 欢迎加入聚会';

    var subtitle = document.createElement('div');
    subtitle.className = 'nickname-modal-subtitle';
    subtitle.textContent = '请输入你的名字';

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'nickname-input';
    input.className = 'nickname-modal-input';
    input.placeholder = '你的名字';
    input.maxLength = 12;
    input.setAttribute('aria-label', '请输入你的名字');
    /* Auto-focus with a delay to avoid iOS keyboard issues */
    setTimeout(function () { input.focus(); }, 300);

    var errorEl = document.createElement('div');
    errorEl.className = 'nickname-modal-error';
    errorEl.id = 'nickname-error';

    var btn = document.createElement('button');
    btn.id = 'nickname-confirm';
    btn.className = 'nickname-modal-btn';
    btn.textContent = '确 认';

    modal.appendChild(title);
    modal.appendChild(subtitle);
    modal.appendChild(input);
    modal.appendChild(errorEl);
    modal.appendChild(btn);
    overlay.appendChild(modal);
    container.appendChild(overlay);

    /* Events */
    btn.addEventListener('click', onConfirm);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onConfirm();
    });
    /* Don't close on overlay click (prevent accidental close) */
  }

  function onConfirm() {
    var input = document.getElementById('nickname-input');
    var errorEl = document.getElementById('nickname-error');
    var val = input ? input.value : '';
    var result = Utils.validateNickname(val);

    if (!result.valid) {
      errorEl.textContent = result.error;
      if (input) input.style.borderColor = 'var(--color-error)';
      return;
    }

    errorEl.textContent = '';
    if (input) input.style.borderColor = '';

    var userId = Utils.generateId('user');
    var user = Models.createUser(userId, val.trim());
    hideModal();
    resolveCallback(user);
  }

  var resolveCallback = null;

  function hideModal() {
    if (container) {
      container.innerHTML = '';
    }
  }

  window.NicknameModal = {
    show: function () {
      buildModal();
    },

    getUser: function () {
      return new Promise(function (resolve) {
        resolveCallback = resolve;
      });
    },
  };
})();
