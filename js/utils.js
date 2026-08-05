'use strict';

window.Utils = {
  /* Generate unique ID: prefix_timestamp_random */
  generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  },

  /* Validate nickname: non-empty, 2-12 chars, Chinese/English/numbers only */
  validateNickname(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return { valid: false, error: '请输入你的名字' };
    }
    if (trimmed.length < 2) {
      return { valid: false, error: '名字至少需要2个字符' };
    }
    if (trimmed.length > 12) {
      return { valid: false, error: '名字不能超过12个字符' };
    }
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(trimmed)) {
      return { valid: false, error: '名字只能包含中文、英文或数字' };
    }
    return { valid: true, error: null };
  },

  /*
   * Simple similarity check using character overlap ratio.
   * Returns true when similarity >= threshold (default 0.6).
   */
  isSimilar(strA, strB, threshold) {
    threshold = threshold || 0.6;
    const a = (strA || '').trim().toLowerCase();
    const b = (strB || '').trim().toLowerCase();
    if (!a || !b) return false;
    if (a === b) return true;

    /* Case 1: direct substring match */
    if (a.includes(b) || b.includes(a)) return true;

    /* Case 2: character set overlap ratio */
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    let intersection = 0;
    setA.forEach((ch) => { if (setB.has(ch)) intersection++; });
    const union = new Set([...setA, ...setB]).size;
    const similarity = union === 0 ? 0 : intersection / union;
    return similarity >= threshold;
  },

  /* Format Date to HH:mm or MM/DD */
  formatTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `${hours}:${mins}`;
    }
    return `${month}/${day}`;
  },

  /* Escape HTML to prevent XSS */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  },

  /* Debounce: returns a debounced function */
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },

  /* Show a toast message */
  showToast(message, duration) {
    duration = duration || 1500;
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, duration);
  },
};
