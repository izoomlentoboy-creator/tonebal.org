import { useEffect, useRef, useState } from "react";

interface VKSignInButtonProps {
  className?: string;
}

export function VKSignInButton({ className }: VKSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@vkid/sdk@2.2.0/dist-sdk/umd/index.js";
    script.async = true;

    script.onload = () => {
      setTimeout(() => initVKID(), 100);
    };

    script.onerror = () => {
      setError("Не удалось загрузить VK SDK");
      setIsLoading(false);
    };

    document.body.appendChild(script);
  }, []);

  const initVKID = () => {
    const VKID = (window as any).VKIDSDK;
    if (!VKID) {
      setError("VK SDK не инициализирован");
      setIsLoading(false);
      return;
    }

    if (!containerRef.current) {
      setError("Контейнер не найден");
      setIsLoading(false);
      return;
    }

    try {
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
        .on(VKID.WidgetEvents.ERROR, (err: any) => {
          console.error("[VK Auth] Widget error:", err);
          setError("Ошибка виджета VK");
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
          const code = payload.code;
          const deviceId = payload.device_id;

          try {
            const data = await VKID.Auth.exchangeCode(code, deviceId);

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
              setError("Ошибка авторизации на сервере");
            }
          } catch (err) {
            console.error("[VK Auth] Exchange error:", err);
            setError("Ошибка обмена токена");
          }
        });

      setIsLoading(false);
    } catch (err) {
      console.error("[VK Auth] Init error:", err);
      setError("Ошибка инициализации VK SDK");
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className={className}>
        <div className="text-center text-red-500 text-sm p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoading && (
        <div className="flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
          <span className="ml-2 text-slate-500">Загрузка VK...</span>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ minHeight: isLoading ? 0 : "44px", display: isLoading ? "none" : "block" }}
      />
    </div>
  );
}

export default VKSignInButton;
