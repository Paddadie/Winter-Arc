/// <reference types="vite/client" />

/**
 * Déclaration manuelle du module virtuel de vite-plugin-pwa pour React,
 * plutôt qu'une référence à un chemin de types du package (les entrées
 * exactes varient selon les versions) : on fige ici la forme documentée
 * de useRegisterSW, indépendante de la résolution de types du package.
 */
declare module "virtual:pwa-register/react" {
  import type { Dispatch, SetStateAction } from "react";

  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}