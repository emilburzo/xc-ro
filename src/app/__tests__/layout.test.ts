import type { Metadata } from "next";

// Mock next-intl (client module, imported by layout for NextIntlClientProvider)
jest.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Mock next-intl/server
const mockTranslations: Record<string, string> = {
  homeTitle: "XC-RO - Analiză zboruri parapantă România",
  homeDescription:
    "Explorează datele zborurilor de parapantă din România. Decolări, statistici piloți, performanțe aripi, recorduri de zbor și analize XC din 2007.",
};
jest.mock("next-intl/server", () => ({
  getLocale: jest.fn().mockResolvedValue("ro"),
  getMessages: jest.fn().mockResolvedValue({}),
  getTranslations: jest.fn().mockResolvedValue((key: string) => {
    return mockTranslations[key] || key;
  }),
}));

// Mock seo module
jest.mock("@/lib/seo", () => ({
  getBaseUrl: () => "https://xc-ro.emilburzo.com",
}));

describe("layout generateMetadata", () => {
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

  it("includes standard OpenGraph and Twitter metadata", async () => {
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
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: "summary",
      })
    );
  });
});
