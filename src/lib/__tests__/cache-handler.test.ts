/**
 * @jest-environment node
 */

// CommonJS handler — require() to avoid TS ESM/CJS interop friction.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cacheHandlerModule = require("../cache-handler.cjs");
const CacheHandler = cacheHandlerModule;
const { __clearForTests, __statsForTests } = cacheHandlerModule;

type Ctx = { tags?: string[]; revalidate?: number };

describe("cache-handler", () => {
  let handler: {
    get: (key: string) => Promise<{ value: unknown; lastModified: number; tags: string[] } | null>;
    set: (key: string, data: unknown, ctx?: Ctx) => Promise<void>;
    revalidateTag: (tag: string | string[]) => Promise<void>;
    resetRequestCache: () => void;
  };

  beforeEach(() => {
    __clearForTests();
    handler = new CacheHandler({ dev: false });
  });

  it("returns null for missing keys", async () => {
    expect(await handler.get("missing")).toBeNull();
  });

  it("stores and retrieves values with metadata", async () => {
    const before = Date.now();
    await handler.set("k1", { foo: "bar" }, { tags: ["takeoffs"], revalidate: 60 });
    const after = Date.now();

    const got = await handler.get("k1");
    expect(got).not.toBeNull();
    expect(got!.value).toEqual({ foo: "bar" });
    expect(got!.tags).toEqual(["takeoffs"]);
    expect(got!.lastModified).toBeGreaterThanOrEqual(before);
    expect(got!.lastModified).toBeLessThanOrEqual(after);
  });

  it("invalidates all keys for a tag (single tag form)", async () => {
    await handler.set("a", 1, { tags: ["takeoffs"] });
    await handler.set("b", 2, { tags: ["takeoffs", "pilots"] });
    await handler.set("c", 3, { tags: ["pilots"] });

    await handler.revalidateTag("takeoffs");

    expect(await handler.get("a")).toBeNull();
    expect(await handler.get("b")).toBeNull();
    const c = await handler.get("c");
    expect(c?.value).toBe(3);
  });

  it("invalidates by array of tags", async () => {
    await handler.set("a", 1, { tags: ["takeoffs"] });
    await handler.set("b", 2, { tags: ["pilots"] });
    await handler.set("c", 3, { tags: ["wings"] });

    await handler.revalidateTag(["takeoffs", "pilots"]);

    expect(await handler.get("a")).toBeNull();
    expect(await handler.get("b")).toBeNull();
    expect((await handler.get("c"))?.value).toBe(3);
  });

  it("re-indexes tags when an entry is overwritten", async () => {
    await handler.set("k", "v1", { tags: ["takeoffs"] });
    await handler.set("k", "v2", { tags: ["pilots"] });

    // Old tag no longer points at this key.
    await handler.revalidateTag("takeoffs");
    expect((await handler.get("k"))?.value).toBe("v2");

    // New tag still does.
    await handler.revalidateTag("pilots");
    expect(await handler.get("k")).toBeNull();
  });

  it("tolerates entries with no tags", async () => {
    await handler.set("k", 42, {});
    expect((await handler.get("k"))?.value).toBe(42);
    await handler.revalidateTag("anything");
    expect((await handler.get("k"))?.value).toBe(42);
  });

  it("tolerates revalidating a tag that has no entries", async () => {
    await expect(handler.revalidateTag("nobody")).resolves.toBeUndefined();
  });

  it("drops the tag index entirely when its last key is removed", async () => {
    await handler.set("a", 1, { tags: ["solo"] });
    expect(__statsForTests().tagCount).toBe(1);

    await handler.revalidateTag("solo");
    expect(__statsForTests().tagCount).toBe(0);
  });

  it("shares state across CacheHandler instances (singleton store)", async () => {
    const h2 = new CacheHandler({ dev: false });
    await handler.set("shared", "hello", { tags: ["home"] });
    expect((await h2.get("shared"))?.value).toBe("hello");
  });

  it("survives unserializable values without throwing", async () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    await expect(
      handler.set("c", cyclic, { tags: ["home"] }),
    ).resolves.toBeUndefined();
    // Value should still be retrievable (we don't serialize on the read path).
    const got = await handler.get("c");
    expect(got).not.toBeNull();
    expect(got!.value).toBe(cyclic);
  });
});
