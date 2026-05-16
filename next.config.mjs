import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  cacheHandler: path.join(__dirname, "src/lib/cache-handler.cjs"),
  cacheMaxMemorySize: 0,
};

export default withNextIntl(nextConfig);
