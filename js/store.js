'use strict';

(function () {
  /* Storage driver with fallback */
  function getStorageDriver() {
    try {
      const key = '__storage_test__';
      localStorage.setItem(key, 'test');
      localStorage.removeItem(key);
      return {
        storage: localStorage,
        available: true,
      };
    } catch (e) {
      const mem = new Map();
      return {
        storage: {
          getItem: (k) => mem.get(k) || null,
          setItem: (k, v) => mem.set(k, v),
          removeItem: (k) => mem.delete(k),
        },
        available: false,
      };
    }
  }

  const driver = getStorageDriver();
  window._isStorageAvailable = driver.available;

  class Store {
    constructor() {
      this._subscribers = new Set();
      this._storage = driver.storage;
      this._state = {
        user: null,
        gathering: null,
        dishes: {},
        activeTab: 'all',
        loading: false,
      };

      /* Global error handling */
      window.addEventListener('error', (e) => {
        console.error('Unhandled error:', e.message, e.filename, e.lineno);
      });
      window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
      });
    }

    get state() {
      return { ...this._state };
    }

    get dishes() {
      return Object.values(this._state.dishes);
    }

    subscribe(fn) {
      this._subscribers.add(fn);
      return () => { this._subscribers.delete(fn); };
    }

    _notify(change) {
      this._saveToStorage();
      // 将本地数据推送到云端 (Sync 模块)
      if (window.Sync) {
        window.Sync.push(this._state.dishes);
      }
      this._subscribers.forEach((fn) => { fn(this._state, change); });
    }

    /* 新增：接收云端数据的方法 */
    restoreDishes(dishesObject) {
      this._state.dishes = dishesObject || {};
      this._saveToStorage();
      this._notify({ type: 'sync:restore' });
    }

    _saveToStorage() {
      if (this._state.user) {
        this._storage.setItem('dishapp_user', JSON.stringify(this._state.user));
      }
      const g = this._state.gathering;
      if (g) {
        this._storage.setItem(
          'dishapp_dishes_' + g.id,
          JSON.stringify(this._state.dishes)
        );
      }
    }

    loadFromStorage(gatheringId) {
      try {
        const userStr = this._storage.getItem('dishapp_user');
        if (userStr) {
          this._state.user = JSON.parse(userStr);
        }
        if (gatheringId) {
          const dishesStr = this._storage.getItem('dishapp_dishes_' + gatheringId);
          if (dishesStr) {
            this._state.dishes = JSON.parse(dishesStr);
          }
        }
      } catch (e) {
        console.error('Failed to load from storage:', e);
      }
    }

    setUser(user) {
      this._state.user = user;
      this._notify({ type: 'user:set' });
    }

    setGathering(gathering) {
      this._state.gathering = gathering;
      this._notify({ type: 'gathering:set' });
    }

    addDish(dish) {
      this._state.dishes[dish.id] = dish;
      this._notify({ type: 'dish:add', dish: dish });
    }

    removeDish(id) {
      const dish = this._state.dishes[id];
      if (!dish) return false;
      if (this._state.user && dish.proposedBy !== this._state.user.id) return false;
      delete this._state.dishes[id];
      this._notify({ type: 'dish:remove', id: id });
      return true;
    }

    vote(dishId, userId) {
      const dish = this._state.dishes[dishId];
      if (!dish) return false;
      if (dish.votes[userId]) {
        return this.unvote(dishId, userId);
      }
      dish.votes[userId] = { timestamp: new Date().toISOString() };
      this._notify({ type: 'dish:vote', dishId: dishId, userId: userId });
      return true;
    }

    unvote(dishId, userId) {
      const dish = this._state.dishes[dishId];
      if (!dish || !dish.votes[userId]) return false;
      delete dish.votes[userId];
      this._notify({ type: 'dish:unvote', dishId: dishId, userId: userId });
      return true;
    }

    star(dishId, userId) {
      const dish = this._state.dishes[dishId];
      if (!dish) return false;
      const allDishes = Object.values(this._state.dishes);
      allDishes.forEach((d) => {
        const idx = d.starredBy.indexOf(userId);
        if (idx !== -1) d.starredBy.splice(idx, 1);
      });
      dish.starredBy.push(userId);
      this._notify({ type: 'dish:star', dishId: dishId, userId: userId });
      return true;
    }

    unstar(dishId, userId) {
      const dish = this._state.dishes[dishId];
      if (!dish) return false;
      const idx = dish.starredBy.indexOf(userId);
      if (idx === -1) return false;
      dish.starredBy.splice(idx, 1);
      this._notify({ type: 'dish:unstar', dishId: dishId, userId: userId });
      return true;
    }

    getDishesSorted() {
      const dishes = Object.values(this._state.dishes);
      return dishes.sort((a, b) => {
        const voteA = Object.keys(a.votes || {}).length;
        const voteB = Object.keys(b.votes || {}).length;
        if (voteB !== voteA) return voteB - voteA;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    }

    getDishesFiltered(tab) {
      let dishes = this.getDishesSorted();
      if (tab === 'hot') {
        dishes = dishes.filter(
          (d) => Object.keys(d.votes || {}).length >= 2
        ).slice(0, 10);
      } else if (tab === 'mine') {
        if (this._state.user) {
          dishes = dishes.filter((d) => d.proposedBy === this._state.user.id);
        } else {
          dishes = [];
        }
      }
      return dishes;
    }

    canPropose(userId) {
      if (!userId) return false;
      const dishes = Object.values(this._state.dishes);
      const count = dishes.filter((d) => d.proposedBy === userId).length;
      return count < 5;
    }
  }

  window.Store = new Store();
})();
