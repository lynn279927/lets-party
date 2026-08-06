'use strict';
/* 
 * 智能菜单生成器 
 * 自动分类：荤菜 / 素菜 / 汤 / 其他
 * 推荐组合：2 荤 + 1 素 + 1 汤
 */
window.MenuGenerator = {
  render: function(dishes) {
    var main = document.getElementById('dish-list');
    if (!main) return;

    // 1. 只有状态为 active 的菜才参与推荐
    var activeDishes = dishes.filter(function(d) { return d.status === 'active'; });

    if (activeDishes.length === 0) {
      main.innerHTML = '<div class="empty-state">还没人提菜哦，快去提一个吧！</div>';
      return;
    }

    // 2. 智能分类
    var meats = [], vegs = [], soups = [];
    
    activeDishes.forEach(function(d) {
      var name = d.name;
      if (/[肉猪牛羊排鸡鸭鱼虾蟹]/.test(name)) {
        meats.push(d);
      } else if (/汤/.test(name)) {
        soups.push(d);
      } else {
        vegs.push(d);
      }
    });

    // 3. 组合菜单 (2荤 + 1素 + 1汤)
    var combo = [];
    
    if (meats.length > 0) combo.push(meats[Math.floor(Math.random() * meats.length)]);
    if (meats.length > 1) {
       // 选第二道荤菜，尽量不重复
       var remainingMeats = meats.filter(function(m){ return m !== combo[0]; });
       if(remainingMeats.length > 0) combo.push(remainingMeats[Math.floor(Math.random() * remainingMeats.length)]);
    }
    
    if (vegs.length > 0) combo.push(vegs[Math.floor(Math.random() * vegs.length)]);
    if (soups.length > 0) combo.push(soups[Math.floor(Math.random() * soups.length)]);

    // 4. 渲染界面
    var html = '<div style="text-align:center; padding:16px; background:#fff0f0; border-radius:16px; margin-bottom:16px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#d32f2f;">🤖 为你推荐今日菜单</div>';
    html += '<div style="font-size:12px; color:#888;">(如果不满意，刷新页面试试新组合)</div>';
    html += '</div>';

    // 渲染推荐组合
    combo.forEach(function(d) {
      html += createCard(d, '✨ 推荐');
    });

    // 渲染其余备选菜
    html += '<div style="margin:20px 0 10px; text-align:center; font-size:12px; color:#aaa;">—— 其他备选 ——</div>';
    activeDishes.forEach(function(d) {
      if (combo.indexOf(d) === -1) {
        html += createCard(d);
      }
    });

    main.innerHTML = html;
  }
};

// 辅助函数：生成卡片
function createCard(dish, tag) {
  var html = '<div class="dish-card" style="position:relative;">';
  
  // 标题
  html += '<div class="dish-card-top">';
  html += '<div class="dish-card-name">🍽️ ' + dish.name + '</div>';
  if (tag) html += '<span style="color:#d32f2f; font-weight:bold; font-size:12px;">' + tag + '</span>';
  html += '</div>';

  // 备注
  if (dish.notes) {
    html += '<div style="background:#fff8e1; padding:6px 8px; border-radius:8px; font-size:12px; color:#e65100; margin:6px 0;">📝 ' + dish.notes + '</div>';
  }

  // 提议人
  html += '<div class="dish-card-proposer">提议人：' + dish.proposerName + '</div>';
  
  // 删除按钮（仅提议人可见）
  if (window.Store._state.user && dish.proposedBy === window.Store._state.user.id) {
    html += '<button onclick="deleteDish(\'' + dish.id + '\')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:16px; opacity:0.5;">🗑️</button>';
  }

  html += '</div>';
  return html;
}

// 暴露在 window 上供按钮调用
window.deleteDish = function(id) {
  if(confirm('确定删除吗？')) {
    if(window.Store) {
        window.Store.removeDish(id);
        if(window.MenuGenerator) window.MenuGenerator.render(window.Store.dishes);
    }
  }
};
