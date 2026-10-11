import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "public/**",
      "cloudflare-worker/node_modules/**",
      "cloudflare-worker/.wrangler/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // The site's images are SVG logos and the export is unoptimised
      // (images.unoptimized), so next/image would add nothing.
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
