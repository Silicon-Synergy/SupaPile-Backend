import { categoriesCache, pilesCache, publicLinkCache } from './cache-with-nodeCache.js';

export const clearCategoryCache = (userId) => {
  const cacheKey = `categories:${userId}`;
  categoriesCache.del(cacheKey);
};

export const clearPilesCache = (userId) => {
  const cacheKeys = pilesCache.keys();
  const userPileKeys = cacheKeys.filter((key) =>
    key.startsWith(`piles:${userId}:`)
  );
  userPileKeys.forEach((key) => pilesCache.del(key));
};

export const clearPublicLinkCache = (userId) => {
  const publicCacheKeys = publicLinkCache.keys();
  const userPublicKeys = publicCacheKeys.filter((key) =>
    key.includes(userId)
  );
  userPublicKeys.forEach((key) => publicLinkCache.del(key));
};