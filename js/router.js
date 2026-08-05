'use strict';

window.Router = {
  /* Parse ?gathering=xxx&name=xxx from URL */
  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      gatheringId: params.get('gathering') || null,
      gatheringName: params.get('name') || null,
    };
  },

  /* Build a share URL for a gathering */
  buildShareUrl(gatheringId, gatheringName) {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('gathering', gatheringId);
    if (gatheringName) params.set('name', encodeURIComponent(gatheringName));
    return `${base}?${params.toString()}`;
  },

  /* Check if current URL has a gatheringId */
  isInGathering() {
    return !!this.parseUrlParams().gatheringId;
  },

  /* Navigate to a gathering URL without reload */
  redirectToGathering(gatheringId, gatheringName) {
    const url = this.buildShareUrl(gatheringId, gatheringName);
    window.history.pushState({ gatheringId }, '', url);
  },
};
