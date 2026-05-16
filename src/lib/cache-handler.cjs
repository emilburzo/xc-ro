"use strict";

const { LRUCache } = require("lru-cache");

const DEFAULT_MAX_SIZE_BYTES = 256 * 1024 * 1024;

const MAX_SIZE_BYTES =
  Number(process.env.CACHE_HANDLER_MAX_SIZE_BYTES) || DEFAULT_MAX_SIZE_BYTES;

const cache = new LRUCache({
  maxSize: MAX_SIZE_BYTES,
  sizeCalculation: (entry) => entry.size,
});

const tagToKeys = new Map();

function indexTags(key, tags) {
  if (!tags || tags.length === 0) return;
  for (const tag of tags) {
    let set = tagToKeys.get(tag);
    if (!set) {
      set = new Set();
      tagToKeys.set(tag, set);
    }
    set.add(key);
  }
}

function deindexTags(key, tags) {
  if (!tags || tags.length === 0) return;
  for (const tag of tags) {
    const set = tagToKeys.get(tag);
    if (!set) continue;
    set.delete(key);
    if (set.size === 0) tagToKeys.delete(tag);
  }
}

function estimateSize(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value)) + 256;
  } catch {
    return 1024;
  }
}

class XcRoCacheHandler {
  constructor(options) {
    this.options = options || {};
  }

  async get(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    return {
      value: entry.value,
      lastModified: entry.lastModified,
      tags: entry.tags,
    };
  }

  async set(key, data, ctx) {
    const previous = cache.peek(key);
    if (previous) deindexTags(key, previous.tags);

    const tags = (ctx && ctx.tags) || [];
    const entry = {
      value: data,
      tags,
      lastModified: Date.now(),
      size: estimateSize(data),
    };

    cache.set(key, entry);
    indexTags(key, tags);
  }

  async revalidateTag(tag) {
    const tags = Array.isArray(tag) ? tag : [tag];
    for (const t of tags) {
      const keys = tagToKeys.get(t);
      if (!keys) continue;
      for (const key of Array.from(keys)) {
        const entry = cache.peek(key);
        if (entry) deindexTags(key, entry.tags);
        cache.delete(key);
      }
    }
  }

  resetRequestCache() {}
}

function __clearForTests() {
  cache.clear();
  tagToKeys.clear();
}

function __statsForTests() {
  return { entryCount: cache.size, tagCount: tagToKeys.size };
}

module.exports = XcRoCacheHandler;
module.exports.default = XcRoCacheHandler;
module.exports.__clearForTests = __clearForTests;
module.exports.__statsForTests = __statsForTests;
