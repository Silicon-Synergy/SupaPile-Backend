import NodeCache from "node-cache";

export const metaCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
});

export const userCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
});

export const categoriesCache = new NodeCache({
  stdTTL: 900,
  checkperiod: 60,
});

export const publicLinkCache = new NodeCache({
  stdTTL: 150,
  checkperiod: 60,
});

// Add pilesCache for main pile listings
export const pilesCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
});

export const getCacheStats = () => {
  return {
    meta: {
      key: metaCache.keys().length,
      hits: metaCache.getStats().hits,
      misses: metaCache.getStats().misses,
    },
    user: {
      key: userCache.keys().length,
      hits: userCache.getStats().hits,
      misses: userCache.getStats().misses,
    },
    categories: {
      key: categoriesCache.keys().length,
      hit: categoriesCache.getStats().hits,
      misses: categoriesCache.getStats().misses,
    },
    publicLink: {
      key: publicLinkCache.keys().length,
      hit: publicLinkCache.getStats().hits,
      misses: publicLinkCache.getStats().misses,
    },
    // Add pilesCache stats
    piles: {
      key: pilesCache.keys().length,
      hits: pilesCache.getStats().hits,
      misses: pilesCache.getStats().misses,
    },
  };
};
