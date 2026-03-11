import { render } from "@testing-library/react";
import { JsonLd } from "../JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Test Site",
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    // JSON is serialized with '<' characters escaped as \u003c to prevent </script> injection (XSS protection)
    const parsed = JSON.parse(script!.textContent!);
    expect(parsed["@type"]).toBe("WebSite");
    expect(parsed.name).toBe("Test Site");
  });

  it("serializes nested objects correctly", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Place",
      name: "Bunloc",
      geo: {
        "@type": "GeoCoordinates",
        latitude: 45.6,
        longitude: 25.5,
      },
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.textContent!);
    expect(parsed.geo.latitude).toBe(45.6);
    expect(parsed.geo.longitude).toBe(25.5);
  });

  it("escapes HTML-sensitive characters to prevent XSS", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "</script><script>alert('xss')</script>",
    };

    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    // Raw content should not contain unescaped < characters
    expect(script!.textContent).not.toContain("</script>");
    expect(script!.textContent).toContain("\\u003c");
  });
});
