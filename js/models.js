'use strict';

window.Models = {
  /* Create a gathering object */
  createGathering(id, name) {
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      id: id,
      name: name,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
  },

  /* Create a user object */
  createUser(id, name) {
    const avatars = ['😊', '😄', '🎉', '🌟', '🍀', '🎈', '🦊', '🐱', '🐶', '🐼', '🎃', '🌈'];
    return {
      id: id,
      name: name,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      joinedAt: new Date().toISOString(),
    };
  },

  /* Create a dish object */
   createDish(id, name, proposedBy, proposerName, notes) {
    return {
      id: id,
      name: name,
      proposedBy: proposedBy,
      proposerName: proposerName,
      notes: notes || '', // 新增：这里用来存备注！
      createdAt: new Date().toISOString(),
      votes: {},
      starredBy: [],
      status: 'active',
    };
  },

  /* Get vote count for a dish */
  dishVoteCount(dish) {
    return Object.keys(dish.votes || {}).length;
  },
};
