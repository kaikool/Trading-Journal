interface Window {
  ENV?: {
    VITE_FIREBASE_API_KEY?: string;
    VITE_FIREBASE_APP_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_AUTH_DOMAIN?: string;
    VITE_FIREBASE_STORAGE_BUCKET?: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    VITE_FIREBASE_MEASUREMENT_ID?: string;
    VITE_FIREBASE_DATABASE_URL?: string;
    VITE_API_BASE_URL?: string;
    TWELVEDATA_API_KEY?: string;
    FIREBASE_CONFIG?: string; // Firebase Functions config data (định dạng 2-part key)
  };
}