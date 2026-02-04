import { useEffect, useRef } from "react";

interface VKOneTapInstance {
  render: (options: {
    container: HTMLElement;
    showAlternativeLogin: boolean;
  }) => VKOneTapInstance;
  on: (event: unknown, handler: (payload?: unknown) => void) => VKOneTapInstance;
}

interface VKIDSDK {
  Config: {
    init: (config: {
      app: number;
      redirectUrl: string;
      responseMode: unknown;
      source: unknown;
      scope: string;
    }) => void;
  };
  ConfigResponseMode: {
    Callback: unknown;
  };
  ConfigSource: {
    LOWCODE: unknown;
  };
  OneTap: new () => VKOneTapInstance;
  WidgetEvents: {
    ERROR: unknown;
  };
  OneTapInternalEvents: {
    LOGIN_SUCCESS: unknown;
  };
  Auth: {
    exchangeCode: (code: string, deviceId: string) => Promise<unknown>;
  };
}

declare global {
  interface Window {
    VKIDSDK?: VKIDSDK;
  }
}

const VK_APP_ID = 54441764;
const VK_REDIRECT_URL = "https://tonebal.org/api/auth/vk/callback";

interface VKSignInButtonProps {
  className?: string;
}

export function VKSignInButton({ className }: VKSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    const initVKID = () => {
      if (!window.VKIDSDK || !containerRef.current) return;

      const VKID = window.VKIDSDK;

      VKID.Config.init({
        app: VK_APP_ID,
        redirectUrl: VK_REDIRECT_URL,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: "email",
      });

      const oneTap = new VKID.OneTap();

      oneTap
        .render({
          container: containerRef.current,
          showAlternativeLogin: true,
        })
        .on(VKID.WidgetEvents.ERROR, (error) => {
          console.error("[VK ID] Error:", error);
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload) => {
          const data = payload as { code: string; device_id: string };
          const code = data.code;
          const deviceId = data.device_id;

          VKID.Auth.exchangeCode(code, deviceId)
            .then((result) => {
              console.log("[VK ID] Success:", result);
              // Перенаправляем на сервер для создания сессии
              const authData = result as { access_token: string; user_id: number; email?: string };
              window.location.href = `/api/auth/vk/token?access_token=${authData.access_token}&user_id=${authData.user_id}&email=${authData.email || ""}`;
            })
            .catch((error) => {
              console.error("[VK ID] Exchange error:", error);
            });
        });

      initializedRef.current = true;
    };

    // Проверяем, загружен ли SDK
    if (window.VKIDSDK) {
      initVKID();
    } else {
      // Загружаем SDK динамически
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js";
      script.async = true;
      script.onload = () => {
        // Даём время на инициализацию
        setTimeout(initVKID, 100);
      };
      document.head.appendChild(script);
    }
  }, []);

  return <div ref={containerRef} className={className} />;
}

export default VKSignInButton;
