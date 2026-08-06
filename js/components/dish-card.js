'use strict';

window.DishCard = {
  /*
   * 创建菜品卡片 (已优化：移除点赞/想吃，增加备注)
   */
  createElement: function (dish, currentUser) {
    var card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.dishId = dish.id;

    // 根据菜品名生成随机 Emoji
    var emojis = ['🍕', '🍲', '🍜', '🥩', '🍖', '🍣', '🍝', '🥘', '🍔', '🧁'];
    var emoji = emojis[dish.id.charCodeAt(dish.id.length - 1) % emojis.length];

    /* 1. 顶部：菜名 + 提议人 */
    var topRow = document.createElement('div');
    topRow.className = 'dish-card-top';

    var nameEl = document.createElement('div');
    nameEl.className = 'dish-card-name';
    nameEl.textContent = emoji + ' ' + dish.name;

    var proposerEl = document.createElement('div');
    proposerEl.className = 'dish-card-proposer';
    proposerEl.textContent = '👤 ' + (dish.proposerName || '匿名');

    topRow.appendChild(nameEl);
    topRow.appendChild(proposerEl);
    card.appendChild(topRow);

    /* 2. 新增：显示备注 */
    if (dish.notes && dish.notes.trim() !== '') {
      var noteDiv = document.createElement('div');
      noteDiv.className = 'dish-notes';
      noteDiv.textContent = '📝 ' + dish.notes;
      card.appendChild(noteDiv);
    }

    /* 3. 删除：原有的点赞和想吃什么按钮已移除 */

    /* 4. 提议人专属删除按钮 */
    var isOwner = currentUser && dish.proposedBy === currentUser.id;
    if (isOwner) {
      card.style.position = 'relative'; 
      
      var deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.setAttribute('aria-label', '删除提议');
      deleteBtn.title = '删除';
      deleteBtn.style.cssText = 'position:absolute; top:10px; right:10px; font-size:18px; background:none; border:none; cursor:pointer; opacity:0.5; padding:0; min-width:30px; min-height:30px;';
      
      deleteBtn.onclick = function(e) {
        e.stopPropagation(); // 防止冒泡
        if(confirm('确定要删除「' + dish.name + '」吗？')) {
          window.Store.removeDish(dish.id);
        }
      };
      card.appendChild(deleteBtn);
    }

    return card;
  },
};
