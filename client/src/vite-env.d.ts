/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_DATABASE_URL?: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string

  readonly VITE_API_BASE_URL?: string
  readonly VITE_TWELVEDATA_API_KEY?: string
  readonly TWELVEDATA_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global window.ENV để hỗ trợ phương pháp config.js
interface Window {
  ENV?: {
    VITE_FIREBASE_API_KEY?: string
    VITE_FIREBASE_APP_ID?: string
    VITE_FIREBASE_PROJECT_ID?: string
    VITE_FIREBASE_AUTH_DOMAIN?: string
    VITE_FIREBASE_STORAGE_BUCKET?: string
    VITE_FIREBASE_MESSAGING_SENDER_ID?: string
    VITE_FIREBASE_DATABASE_URL?: string
    VITE_FIREBASE_MEASUREMENT_ID?: string
    VITE_API_BASE_URL?: string
    VITE_TWELVEDATA_API_KEY?: string
    TWELVEDATA_API_KEY?: string
  }
}