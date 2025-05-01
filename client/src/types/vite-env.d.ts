/// <reference types="vite/client" />

import type { ServerOptions } from 'vite';

declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | string[] | true;
  }
}