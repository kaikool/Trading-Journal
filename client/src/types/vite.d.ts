// Custom type declarations for Vite
import { ServerOptions } from 'vite'

declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | string[];
  }
}