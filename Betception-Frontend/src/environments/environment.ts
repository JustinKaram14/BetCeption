declare global {
  interface Window {
    __BETCEPTION_CONFIG__?: {
      apiBaseUrl?: string;
      includeCredentials?: boolean;
    };
  }
}

const runtimeConfig =
  typeof window !== 'undefined' ? window.__BETCEPTION_CONFIG__ : undefined;

export const environment = {
  /**
   * Base URL of the Betception backend. Adjust if your API runs elsewhere.
   */
  apiBaseUrl: runtimeConfig?.apiBaseUrl?.trim() || window.location.origin,
  /**
   * Whether API requests should include credentials (cookies) for refresh/logout flows.
   */
  includeCredentials: runtimeConfig?.includeCredentials ?? true,
};

