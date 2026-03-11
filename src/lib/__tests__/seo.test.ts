describe("getBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns default URL when env var is not set", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    const { getBaseUrl } = await import("../seo");
    expect(getBaseUrl()).toBe("https://xc-ro.emilburzo.com");
  });

  it("returns NEXT_PUBLIC_BASE_URL when set", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://custom-domain.com";
    const { getBaseUrl } = await import("../seo");
    expect(getBaseUrl()).toBe("https://custom-domain.com");
  });
});
