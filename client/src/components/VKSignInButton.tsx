import { useEffect, useRef } from "react";

interface VKSignInButtonProps {
  className?: string;
}

declare global {
  interface Window {
    VKIDSDK?: {
      Config: {
        init: (config: {
          app: number;
          redirectUrl: string;
          responseMode: string;
          source: string;
          scope: string;
        }) => void;
      };
      ConfigResponseMode: {
        Callback: string;
      };
      ConfigSource: {
        LOWCODE: string;
      };
      OneTap: new () => {
        render: (options: { container: HTMLElement | null; showAlternativeLogin: boolean }) => {
          on: (event: string, callback: (data: unknown) => void) => {
            on: (event: string, callback: (data: unknown) => void) => void;
          };
        };
      };
      Auth: {
        exchangeCode: (code: string, deviceId: string) => Promise<{
          access_token: string;
          user_id: number;
          email?: string;
        }>;
      };
      WidgetEvents: {
        ERROR: string;
      };
      OneTapInternalEvents: {
        LOGIN_SUCCESS: string;
      };
    };
  }
}

export function VKSignInButton({ className }: VKSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@vkid/sdk@2.0.0/dist-sdk/umd/index.js";
    script.async = true;

    script.onload = () => {
      scriptLoadedRef.current = true;
      initVKID();
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initVKID = () => {
    const VKID = window.VKIDSDK;
    if (!VKID || !containerRef.current) return;

    VKID.Config.init({
      app: 54441764,
      redirectUrl: "https://tonebal.org/api/auth/vk/callback",
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: "",
    });

    const oneTap = new VKID.OneTap();

    oneTap
      .render({
        container: containerRef.current,
        showAlternativeLogin: true,
      })
      .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
        console.error("[VK Auth] Widget error:", error);
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: unknown) => {
        const { code, device_id } = payload as { code: string; device_id: string };

        try {
          const data = await VKID.Auth.exchangeCode(code, device_id);
          // Отправляем токен на сервер для создания сессии
          const response = await fetch("/api/auth/vk/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: data.access_token,
              user_id: data.user_id,
              email: data.email,
            }),
          });

          if (response.ok) {
            window.location.href = "/dashboard";
          } else {
            console.error("[VK Auth] Server error");
          }
        } catch (error) {
          console.error("[VK Auth] Exchange error:", error);
        }
      });
  };

  return (
    <div ref={containerRef} className={className} style={{ minHeight: "44px" }} />
  );
}

export default VKSignInButton;
