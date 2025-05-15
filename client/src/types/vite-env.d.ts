/// <reference types="vite/client" />


declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | string[] | true;
  }
}