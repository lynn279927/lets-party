'use strict';

window.DishCard = {
  /*
   * Create a card DOM element for a dish.
   * dish: object from Store
   * currentUser: current user object
   */
  createElement: function (dish, currentUser) {
    var card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.dishId = dish.id;

    var voteCount = Object.keys(dish.votes || {}).length;
    var hasVoted = currentUser && dish.votes && !!dish.votes[currentUser.id];
    var hasStarred = currentUser && dish.starredBy && dish.starredBy.indexOf(currentUser.id) !== -1;
    var isOwner = currentUser && dish.proposedBy === currentUser.id;

    /* Emoji prefix for dish name */
    var emojis = ['\uD83C\uDF55', '\uD83C\uDF72', '\uD83C\uDF5C', '\uD83E\uDD69', '\uD83C\uDF56', '\uD83C\uDF63', '\uD83C\uDF5D', '\uD83E\uDD58', '\uD83C\uDF54', '\uD83E\uDDC1'];
    var emoji = emojis[dish.id.charCodeAt(dish.id.length - 1) % emojis.length];

    /* Top row: dish name + proposer */
    var topRow = document.createElement('div');
    topRow.className = 'dish-card-top';

    var nameEl = document.createElement('div');
    nameEl.className = 'dish-card-name';
    nameEl.textContent = emoji + ' ' + dish.name;

    var proposerEl = document.createElement('div');
    proposerEl.className = 'dish-card-proposer';
    /* Show proposer name (avatar lives in User model, not Dish) */
    var nameText = dish.proposerName || '';
    proposerEl.textContent = nameText;

    topRow.appendChild(nameEl);
    topRow.appendChild(proposerEl);
    card.appendChild(topRow);

    /* Middle row: vote and star buttons */
    var actionsRow = document.createElement('div');
    actionsRow.className = 'dish-card-actions';

    var voteBtn = document.createElement('button');
    voteBtn.className = 'dish-card-vote-btn' + (hasVoted ? ' voted' : '');
    voteBtn.setAttribute('aria-label', hasVoted ? '取消点赞' : '点赞');
    voteBtn.innerHTML = '<span class="vote-icon">\uD83D\uDC4D\uFE0F</span> <span class="vote-count">' + voteCount + '</span>';

    var starBtn = document.createElement('button');
    starBtn.className = 'dish-card-star-btn' + (hasStarred ? ' starred' : '');
    starBtn.setAttribute('aria-label', hasStarred ? '取消最想吃' : '标记最想吃');
    starBtn.innerHTML = '\u2B50\uFE0F 最想吃';

    actionsRow.appendChild(voteBtn);
    actionsRow.appendChild(starBtn);
    card.appendChild(actionsRow);

    /* Bottom row: supporters */
    var supportersEl = document.createElement('div');
    supportersEl.className = 'dish-card-supporters';
    if (voteCount > 0) {
      var voterIds = Object.keys(dish.votes || {});
      /* Try to resolve names from store users if possible */
      var html = '';
      var showCount = Math.min(voterIds.length, 3);
      for (var i = 0; i < showCount; i++) {
        html += '<span class="supporter">' + Utils.escapeHtml(voterIds[i]) + '</span> ';
      }
      if (voteCount > 3) {
        html += '<span class="supporter-more">+' + (voteCount - 3) + '</span>';
      }
      supportersEl.innerHTML = html;
      card.appendChild(supportersEl);
    }

    /* Event: vote */
    voteBtn.addEventListener('click', function () {
      if (!currentUser) return;
      window.Store.vote(dish.id, currentUser.id);
    });

    /* Event: star */
    starBtn.addEventListener('click', function () {
      if (!currentUser) return;
      if (dish.starredBy.indexOf(currentUser.id) !== -1) {
        window.Store.unstar(dish.id, currentUser.id);
      } else {
        window.Store.star(dish.id, currentUser.id);
      }
    });

    /* Long-press to delete (owner only) */
    if (isOwner) {
      var pressTimer = null;
      card.addEventListener('touchstart', function (e) {
        pressTimer = setTimeout(function () {
          if (confirm('删除此提议？')) {
            window.Store.removeDish(dish.id);
          }
          /* Vibrate if supported */
          if (navigator.vibrate) navigator.vibrate(10);
        }, 500);
      });
      card.addEventListener('touchend', function () {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      });
      card.addEventListener('touchcancel', function () {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      });
    }

    return card;
  },
};
