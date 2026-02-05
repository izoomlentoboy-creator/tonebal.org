import { useEffect, useRef, useState } from "react";

interface VKSignInButtonProps {
  className?: string;
}

// Глобальный флаг инициализации SDK
let sdkInitialized = false;

export function VKSignInButton({ className }: VKSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const widgetRendered = useRef(false);

  useEffect(() => {
    // Проверяем, не отрендерен ли уже виджет
    if (widgetRendered.current) return;

    const loadSDK = () => {
      // Если SDK уже загружен
      if ((window as any).VKIDSDK) {
        initVKID();
        return;
      }

      // Загружаем SDK
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@vkid/sdk@2.2.0/dist-sdk/umd/index.js";
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = () => {
        // Даём время на инициализацию глобального объекта
        setTimeout(initVKID, 200);
      };

      script.onerror = () => {
        setStatus("error");
        setErrorMsg("Не удалось загрузить VK SDK");
      };

      document.head.appendChild(script);
    };

    loadSDK();
  }, []);

  const initVKID = () => {
    const VKID = (window as any).VKIDSDK;

    if (!VKID) {
      setStatus("error");
      setErrorMsg("VK SDK не найден");
      return;
    }

    if (!containerRef.current) {
      setStatus("error");
      setErrorMsg("Контейнер не найден");
      return;
    }

    try {
      // Инициализируем конфиг только один раз
      if (!sdkInitialized) {
        VKID.Config.init({
          app: 54441764,
          redirectUrl: "https://tonebal.org/api/auth/vk/callback",
          state: "vkid_auth",
          codeVerifier: "",
          scope: "",
          mode: VKID.ConfigAuthMode?.InNewTab || "new_tab",
        });
        sdkInitialized = true;
      }

      // Создаём кнопку OneTap
      const oneTap = new VKID.OneTap();

      // Рендерим виджет
      oneTap
        .render({
          container: containerRef.current,
          scheme: VKID.Scheme?.LIGHT || "light",
          lang: VKID.Languages?.RUS || "ru",
          showAlternativeLogin: true,
        })
        .on(VKID.WidgetEvents.ERROR, (error: any) => {
          console.error("[VK ID] Widget error:", error);
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
          try {
            const code = payload.code;
            const deviceId = payload.device_id;

            // Обмениваем код на токен через SDK
            const data = await VKID.Auth.exchangeCode(code, deviceId);

            // Отправляем на сервер
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
              console.error("[VK ID] Server auth failed");
            }
          } catch (err) {
            console.error("[VK ID] Exchange error:", err);
          }
        });

      widgetRendered.current = true;
      setStatus("ready");
    } catch (err: any) {
      console.error("[VK ID] Init error:", err);
      setStatus("error");
      setErrorMsg(err?.message || "Ошибка инициализации");
    }
  };

  return (
    <div className={className}>
      {status === "loading" && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
          <span className="ml-3 text-slate-500 text-sm">Загрузка VK ID...</span>
        </div>
      )}

      {status === "error" && (
        <div className="text-center p-4">
          <p className="text-red-500 text-sm mb-3">{errorMsg}</p>
          <a
            href={`https://oauth.vk.com/authorize?client_id=54441764&redirect_uri=${encodeURIComponent("https://tonebal.org/api/auth/vk/callback")}&response_type=code&scope=email&display=page`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0077FF] text-white rounded-xl hover:bg-[#0066DD] transition-colors font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.785 16.241s.288-.032.436-.193c.136-.148.132-.425.132-.425s-.019-1.297.574-1.488c.586-.188 1.339 1.253 2.137 1.807.603.418 1.061.327 1.061.327l2.134-.03s1.116-.07.587-.962c-.043-.073-.309-.662-1.588-1.872-1.34-1.267-1.16-1.062.453-3.254.983-1.334 1.376-2.148 1.253-2.496-.117-.332-.84-.244-.84-.244l-2.406.015s-.178-.025-.31.056c-.129.079-.212.263-.212.263s-.381 1.03-.889 1.907c-1.07 1.85-1.499 1.948-1.674 1.833-.407-.267-.305-1.075-.305-1.648 0-1.792.267-2.54-.52-2.733-.262-.064-.455-.106-1.126-.113-.861-.009-1.589.003-2.001.208-.274.136-.486.44-.357.458.16.022.522.099.714.364.248.342.239 1.11.239 1.11s.143 2.11-.333 2.371c-.327.179-.775-.187-1.739-1.862-.493-.854-.866-1.798-.866-1.798s-.072-.179-.2-.275c-.155-.116-.371-.153-.371-.153l-2.286.015s-.343.01-.469.161c-.112.134-.009.411-.009.411s1.791 4.257 3.818 6.403c1.857 1.967 3.965 1.837 3.965 1.837h.955z"/>
            </svg>
            Войти через VK
          </a>
        </div>
      )}

      <div
        ref={containerRef}
        id="VkIdSdkOneTap"
        style={{
          minHeight: status === "ready" ? "56px" : 0,
          display: status === "ready" ? "flex" : "none",
          justifyContent: "center"
        }}
      />
    </div>
  );
}

export default VKSignInButton;
