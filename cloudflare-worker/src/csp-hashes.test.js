import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { addCspMeta, inlineScriptHashes } from "../../scripts/csp-inline-hashes.mjs";

const sha = (text) => `'sha256-${createHash("sha256").update(text).digest("base64")}'`;
const page = `<!DOCTYPE html><html><head><meta charSet="utf-8"/><script src="/_next/a.js"></script>
<script>self.__next_f=[]</script><script type="application/ld+json">{"@type":"Thing"}</script></head>
<body><script>self.__next_f.push([1,"x"])</script></body></html>`;

describe("per-page CSP for inline scripts", () => {
  it("hashes executable inline scripts only", () => {
    expect(inlineScriptHashes(page).sort()).toEqual(
      [sha("self.__next_f=[]"), sha('self.__next_f.push([1,"x"])')].sort()
    );
  });

  it("puts the policy right after the charset, before any script, once", () => {
    const { html, count } = addCspMeta(page);
    expect(count).toBe(2);
    const meta = html.indexOf('http-equiv="Content-Security-Policy"');
    expect(meta).toBeGreaterThan(html.indexOf("<meta charSet"));
    expect(meta).toBeLessThan(html.indexOf("<script"));
    expect(html).toContain("script-src 'self' https://static.cloudflareinsights.com 'sha256-");
    expect(html).not.toContain("unsafe-inline");
    expect(addCspMeta(html)).toEqual({ html, count: -1 });
  });
});
