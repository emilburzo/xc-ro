import { getBaseUrl } from "../seo";

describe("getBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns NEXT_PUBLIC_BASE_URL when set", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://custom-domain.com";
    // Re-import to pick up new env
    const { getBaseUrl: freshGetBaseUrl } = require("../seo");
    expect(freshGetBaseUrl()).toBe("https://custom-domain.com");
  });

  it("returns default URL when env var is not set", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    const { getBaseUrl: freshGetBaseUrl } = require("../seo");
    expect(freshGetBaseUrl()).toBe("https://xc-ro.emilburzo.com");
  });
});
