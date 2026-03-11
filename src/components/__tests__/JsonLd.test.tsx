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
    expect(JSON.parse(script!.textContent!)).toEqual(data);
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
});
