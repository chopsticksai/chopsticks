import { cn } from "../lib/utils";

interface GeminiLogoIconProps {
  className?: string;
}

export function GeminiLogoIcon({ className }: GeminiLogoIconProps) {
  return (
    <img
      src="/brands/gemini-logo.png"
      alt="Gemini"
      className={cn(className)}
    />
  );
}
