'use strict';

window.DishCard = {
  createElement: function (dish, currentUser) {
    var card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.dishId = dish.id;

    // Emoji 前缀
    var emojis = ['🍕', '🍲', '🍜', '🥩', '🍖', '🍣', '🍝', '🥘', '🍔', '🧁'];
    var emoji = emojis[dish.id.charCodeAt(dish.id.length - 1) % emojis.length];

    /* 1. 顶部：菜名 */
    var nameEl = document.createElement('div');
    nameEl.className = 'dish-card-name';
    nameEl.style.cssText = 'font-size: 17px; font-weight: 600; margin-bottom: 8px;';
    nameEl.textContent = emoji + ' ' + dish.name;
    card.appendChild(nameEl);

    /* 2. 中间：显示备注 (如果有) */
    if (dish.notes && dish.notes.trim() !== '') {
      var noteDiv = document.createElement('div');
      noteDiv.className = 'dish-notes';
      noteDiv.textContent = '📝 ' + dish.notes;
      card.appendChild(noteDiv);
    }

    /* 3. 底部：提议人 + 删除按钮 (Flex 布局互不重叠) */
    var bottomRow = document.createElement('div');
    bottomRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 8px;';

    // 左侧：用户名
    var proposerEl = document.createElement('div');
    proposerEl.className = 'dish-card-proposer';
    proposerEl.style.cssText = 'font-size: 13px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 8px; flex: 1;';
    proposerEl.textContent = '👤 ' + (dish.proposerName || '匿名');
    bottomRow.appendChild(proposerEl);

    // 右侧：删除按钮 (仅提议人可见)
    var isOwner = currentUser && dish.proposedBy === currentUser.id;
    if (isOwner) {
      var deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.setAttribute('aria-label', '删除提议');
      // 取消绝对定位，改为流式布局，靠右对齐
      deleteBtn.style.cssText = 'background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px; opacity: 0.6;';
      
      deleteBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirm('确定要删除「' + dish.name + '」吗？')) {
          window.Store.removeDish(dish.id);
        }
      };
      bottomRow.appendChild(deleteBtn);
    }

    card.appendChild(bottomRow);
    return card;
  },
};
