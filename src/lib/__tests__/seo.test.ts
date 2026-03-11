describe("getBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns default URL in production when env var is not set", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NODE_ENV = "production";
    const { getBaseUrl } = await import("../seo");
    expect(getBaseUrl()).toBe("https://xc-ro.emilburzo.com");
  });

  it("returns localhost in non-production when env var is not set", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NODE_ENV = "development";
    const { getBaseUrl } = await import("../seo");
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("returns NEXT_PUBLIC_BASE_URL when set", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://custom-domain.com";
    const { getBaseUrl } = await import("../seo");
    expect(getBaseUrl()).toBe("https://custom-domain.com");
  });

  it("strips trailing slashes from env var", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://custom-domain.com///";
    const { getBaseUrl } = await import("../seo");
    expect(getBaseUrl()).toBe("https://custom-domain.com");
  });

  it("trims whitespace from env var", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "  https://custom-domain.com  ";
    const { getBaseUrl } = await import("../seo");
    expect(getBaseUrl()).toBe("https://custom-domain.com");
  });
});
