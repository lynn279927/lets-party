'use strict';

(function () {
  var headerEl;

  function render(gathering) {
    headerEl = document.getElementById('header');
    if (!headerEl || !gathering) return;

    var name = gathering.name || '未命名聚会';
    var safeName = Utils.escapeHtml(name);

    headerEl.innerHTML = '';

    var left = document.createElement('div');
    left.className = 'header-left';
    left.textContent = safeName;
    left.title = name;

    var right = document.createElement('button');
    right.className = 'header-share';
    right.textContent = '\uD83D\uDD17 分享';
    right.setAttribute('aria-label', '分享聚会链接');

    right.addEventListener('click', onShare);

    headerEl.appendChild(left);
    headerEl.appendChild(right);
  }

  function onShare() {
    var gathering = window.Store ? window.Store._state.gathering : null;
    if (!gathering) return;

    var url = window.Router ? window.Router.buildShareUrl(gathering.id, gathering.name) : window.location.href;

    /* Try native share first (mobile browsers) */
    if (navigator.share) {
      navigator.share({
        title: '提菜投票 - ' + gathering.name,
        url: url,
      }).catch(function () {
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { Utils.showToast('已复制链接'); },
        function () { legacyCopy(url); }
      );
    } else {
      legacyCopy(url);
    }
  }

  function legacyCopy(url) {
    var ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      Utils.showToast('已复制链接');
    } catch (e) {
      Utils.showToast('复制失败，请手动选择');
    }
    document.body.removeChild(ta);
  }

  window.GatheringHeader = {
    render: render,
  };
})();
