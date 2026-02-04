export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // YooKassa integration
  yookassaShopId: process.env.YOOKASSA_SHOP_ID ?? "513198",
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY ?? "test_*g-9MajwhhX704_hx3udBkn0YAoiMZCE65nmEMeumcsdI",
  baseUrl: process.env.BASE_URL ?? "https://tonebal.org",
  // Subscription settings - monthly
  subscriptionPrice: 2500, // рублей
  subscriptionDays: 30,
  // Subscription settings - yearly
  subscriptionYearlyPrice: 18990, // рублей
  subscriptionYearlyDays: 365,
  // OAuth credentials (server-side)
  // Поддерживаем оба варианта: с VITE_ префиксом (для совместимости) и без
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  vkAppId: process.env.VK_APP_ID ?? process.env.VITE_VK_APP_ID ?? "",
  vkAppSecret: process.env.VK_APP_SECRET ?? "",
};
