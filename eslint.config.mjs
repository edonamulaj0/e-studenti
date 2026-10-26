import nextVitals from "eslint-config-next/core-web-vitals";

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
  ...nextVitals,
  {
    rules: {
      // The site's images are SVG logos and the export is unoptimised
      // (images.unoptimized), so next/image would add nothing.
      "@next/next/no-img-element": "off",
      // New with eslint-config-next 16: rules written for the React Compiler,
      // which this site does not use. The 35 places they flag (setState in an
      // effect, refs read during render) behave correctly in React 19, so they
      // are warnings to clear over time rather than errors that block CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default config;
