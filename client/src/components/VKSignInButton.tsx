import { Button } from "@/components/ui/button";
import { getVKLoginUrl } from "@/const";

interface VKSignInButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function VKSignInButton({
  className,
  size = "default",
  variant = "outline",
}: VKSignInButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      asChild
    >
      <a href={getVKLoginUrl()} className="flex items-center gap-2">
        <VKLogo className="h-5 w-5" />
        <span>Войти через VK</span>
      </a>
    </Button>
  );
}

// VK Logo SVG component
function VKLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.785 16.241s.288-.032.436-.193c.136-.148.132-.425.132-.425s-.019-1.297.574-1.488c.586-.188 1.339 1.253 2.137 1.807.603.418 1.061.327 1.061.327l2.134-.03s1.116-.07.587-.962c-.043-.073-.309-.662-1.588-1.872-1.34-1.267-1.16-1.062.453-3.254.983-1.334 1.376-2.148 1.253-2.496-.117-.332-.84-.244-.84-.244l-2.406.015s-.178-.025-.31.056c-.129.079-.212.263-.212.263s-.381 1.03-.889 1.907c-1.07 1.85-1.499 1.948-1.674 1.833-.407-.267-.305-1.075-.305-1.648 0-1.792.267-2.54-.52-2.733-.262-.064-.455-.106-1.126-.113-.861-.009-1.589.003-2.001.208-.274.136-.486.44-.357.458.16.022.522.099.714.364.248.342.239 1.11.239 1.11s.143 2.11-.333 2.371c-.327.179-.775-.187-1.739-1.862-.493-.854-.866-1.798-.866-1.798s-.072-.179-.2-.275c-.155-.116-.371-.153-.371-.153l-2.286.015s-.343.01-.469.161c-.112.134-.009.411-.009.411s1.791 4.257 3.818 6.403c1.857 1.967 3.965 1.837 3.965 1.837h.955z" />
    </svg>
  );
}

export default VKSignInButton;
