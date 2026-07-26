declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    MEDIA?: R2Bucket;
    [key: string]: unknown;
  };
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Database {
  prepare(query: string): unknown;
}

interface R2Bucket {
  get(key: string): Promise<unknown>;
  put(key: string, value: ReadableStream | ArrayBuffer | string): Promise<unknown>;
  delete(key: string): Promise<void>;
}
