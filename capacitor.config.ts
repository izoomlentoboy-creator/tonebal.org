import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.tonebal.app",
  appName: "ToneBalance",
  webDir: "dist/public",
  server: {
    url: "https://tonebal.org",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
