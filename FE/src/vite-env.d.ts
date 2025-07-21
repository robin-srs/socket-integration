/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEWAY: string;
  readonly VITE_SOCKET_GATEWAY: string;
  readonly VITE_MS1_URL: string;
  // more env variables...
}
