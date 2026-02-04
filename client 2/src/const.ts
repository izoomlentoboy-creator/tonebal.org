export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Apple Sign In configuration
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || "org.tonebal.web";
const APPLE_REDIRECT_URI = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/apple/callback`;

/**
 * Генерирует URL для Apple Sign In
 */
export const getAppleLoginUrl = () => {
  const params = new URLSearchParams({
    client_id: APPLE_CLIENT_ID,
    redirect_uri: APPLE_REDIRECT_URI,
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "name email",
    // state для CSRF защиты
    state: btoa(JSON.stringify({
      returnUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
      timestamp: Date.now()
    })),
  });

  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
};

/**
 * URL для страницы логина
 */
export const getLoginUrl = () => "/login";

/**
 * URL для Google Sign In (если понадобится в будущем)
 */
export const getGoogleLoginUrl = () => {
  // TODO: Добавить Google OAuth если понадобится
  return "/login";
};
