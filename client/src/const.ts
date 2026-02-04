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
 * Генерирует URL для Google OAuth
 */
export const getGoogleLoginUrl = () => {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const GOOGLE_REDIRECT_URI = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/google/callback`;
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid profile email",
    access_type: "offline",
    prompt: "consent",
    state: btoa(JSON.stringify({
      returnUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
      timestamp: Date.now()
    })),
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Генерирует URL для VK OAuth
 */
export const getVKLoginUrl = () => {
  const VK_APP_ID = import.meta.env.VITE_VK_APP_ID || "";
  const VK_REDIRECT_URI = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/vk/callback`;
  
  const params = new URLSearchParams({
    client_id: VK_APP_ID,
    redirect_uri: VK_REDIRECT_URI,
    response_type: "code",
    scope: "email",
    display: "page",
    state: btoa(JSON.stringify({
      returnUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
      timestamp: Date.now()
    })),
  });
  
  return `https://oauth.vk.com/authorize?${params.toString()}`;
};
