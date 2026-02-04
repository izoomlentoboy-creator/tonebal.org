export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * URL для страницы логина
 */
export const getLoginUrl = () => "/login";

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
