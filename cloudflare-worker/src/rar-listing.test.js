import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RarListingError, listRarEntries, rarVersion } from "../../app/lib/rar-listing.js";

// Built to the RAR technotes and accepted by the independent Python `rarfile`
// reader; the parser also matched rarfile on all eight RAR files on the site.
const fixture = (name) => new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));

describe("RAR listing", () => {
  it("reads RAR 5 names (UTF-8), sizes and folders", () => {
    const bytes = fixture("sample-rar5.rar");
    expect(rarVersion(bytes)).toBe(5);
    expect(listRarEntries(bytes)).toEqual([
      { path: "Matematika", size: 0, dir: true },
      { path: "Matematika/Seritë Furie.pdf", size: 10, dir: false },
      { path: "lexo.txt", size: 5, dir: false },
    ]);
  });

  it("reads RAR 4, turning backslashes into folders", () => {
    const bytes = fixture("sample-rar4.rar");
    expect(rarVersion(bytes)).toBe(4);
    expect(listRarEntries(bytes)).toEqual([
      { path: "Afatet", size: 0, dir: true },
      { path: "Afatet/qershor 2024.pdf", size: 13, dir: false },
      { path: "lexo.txt", size: 5, dir: false },
    ]);
  });

  it("refuses what it cannot list instead of guessing", () => {
    expect(() => listRarEntries(new TextEncoder().encode("%PDF-1.4"))).toThrow(RarListingError);
    const truncated = fixture("sample-rar5.rar").slice(0, 40);
    expect(() => listRarEntries(truncated)).toThrow(RarListingError);
    // A RAR 5 archive whose headers are encrypted starts with an encryption header (type 4).
    const encrypted = new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00, 0, 0, 0, 0, 3, 4, 0, 0]);
    expect(() => listRarEntries(encrypted)).toThrow(/encrypted/);
  });

  it("never loops on a header that claims no size", () => {
    const zeroSize = new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00, 0, 0, 0, 0, 0]);
    expect(() => listRarEntries(zeroSize)).toThrow(RarListingError);
  });
});
