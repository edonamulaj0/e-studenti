// Declarations for things the type checker cannot see on its own.

// Next.js extends fetch() with caching options.
interface RequestInit {
  next?: { revalidate?: number | false; tags?: string[] };
}

// Inlined by Next.js at build time.
declare const process: { env: Record<string, string | undefined> };
