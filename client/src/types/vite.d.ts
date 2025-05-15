// Custom type declarations for Vite

declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | string[];
  }
}