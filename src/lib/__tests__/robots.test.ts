import robots from "../../app/robots";

describe("robots", () => {
  it("returns valid robots.txt configuration", () => {
    const result = robots();

    expect(result.rules).toBeDefined();
    expect(result.sitemap).toBeDefined();
  });

  it("allows all user agents", () => {
    const result = robots();
    const rules = result.rules;

    if (Array.isArray(rules)) {
      expect(rules[0].userAgent).toBe("*");
      expect(rules[0].allow).toBe("/");
    } else {
      expect(rules!.userAgent).toBe("*");
      expect(rules!.allow).toBe("/");
    }
  });

  it("includes sitemap URL", () => {
    const result = robots();
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
