import type { Metadata } from "next";

// Mock seo module
jest.mock("@/lib/seo", () => ({
  getBaseUrl: () => "https://xc-ro.emilburzo.com",
}));

// Mock next-intl (client module, imported by layout for NextIntlClientProvider)
jest.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

const roTranslations: Record<string, string> = {
  homeTitle: "XC-RO - Analiză zboruri parapantă România",
  homeDescription:
    "Explorează datele zborurilor de parapantă din România. Decolări, statistici piloți, performanțe aripi, recorduri de zbor și analize XC din 2007.",
};

const enTranslations: Record<string, string> = {
  homeTitle: "XC-RO - Paragliding Flight Analytics Romania",
  homeDescription:
    "Explore paragliding flight data from Romania. Takeoffs, pilot stats, wing performance, flight records & XC analytics since 2007.",
};

function setupLocaleMock(locale: string) {
  const translations = locale === "en" ? enTranslations : roTranslations;
  jest.mock("next-intl/server", () => ({
    getLocale: jest.fn().mockResolvedValue(locale),
    getMessages: jest.fn().mockResolvedValue({}),
    getTranslations: jest.fn().mockResolvedValue((key: string) => {
      return translations[key] || key;
    }),
  }));
}

describe("layout generateMetadata", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("with Romanian locale", () => {
    beforeEach(() => {
      setupLocaleMock("ro");
    });

    it("uses translated homeTitle as default title", async () => {
      const { generateMetadata } = await import("../layout");
      const metadata = (await generateMetadata()) as Metadata;
      const title = metadata.title as { template: string; default: string };
      expect(title.default).toBe(
        "XC-RO - Analiză zboruri parapantă România"
      );
    });

    it("preserves the title template", async () => {
      const { generateMetadata } = await import("../layout");
      const metadata = (await generateMetadata()) as Metadata;
      const title = metadata.title as { template: string; default: string };
      expect(title.template).toBe("%s | XC-RO");
    });

    it("uses translated description", async () => {
      const { generateMetadata } = await import("../layout");
      const metadata = (await generateMetadata()) as Metadata;
      expect(metadata.description).toBe(
        "Explorează datele zborurilor de parapantă din România. Decolări, statistici piloți, performanțe aripi, recorduri de zbor și analize XC din 2007."
      );
    });

    it("sets OpenGraph locale to ro_RO with en_US alternate", async () => {
      const { generateMetadata } = await import("../layout");
      const metadata = (await generateMetadata()) as Metadata;
      expect(metadata.openGraph).toEqual(
        expect.objectContaining({
          type: "website",
          siteName: "XC-RO",
          locale: "ro_RO",
          alternateLocale: "en_US",
        })
      );
    });
  });

  describe("with English locale", () => {
    beforeEach(() => {
      setupLocaleMock("en");
    });

    it("uses English homeTitle as default title", async () => {
      const { generateMetadata } = await import("../layout");
      const metadata = (await generateMetadata()) as Metadata;
      const title = metadata.title as { template: string; default: string };
      expect(title.default).toBe(
        "XC-RO - Paragliding Flight Analytics Romania"
      );
    });

    it("uses English description", async () => {
      const { generateMetadata } = await import("../layout");
      const metadata = (await generateMetadata()) as Metadata;
      expect(metadata.description).toBe(
        "Explore paragliding flight data from Romania. Takeoffs, pilot stats, wing performance, flight records & XC analytics since 2007."
      );
    });

    it("sets OpenGraph locale to en_US with ro_RO alternate", async () => {
      const { generateMetadata } = await import("../layout");
      const metadata = (await generateMetadata()) as Metadata;
      expect(metadata.openGraph).toEqual(
        expect.objectContaining({
          type: "website",
          siteName: "XC-RO",
          locale: "en_US",
          alternateLocale: "ro_RO",
        })
      );
    });
  });

  it("includes Twitter card metadata", async () => {
    setupLocaleMock("ro");
    const { generateMetadata } = await import("../layout");
    const metadata = (await generateMetadata()) as Metadata;
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: "summary",
      })
    );
  });
});
