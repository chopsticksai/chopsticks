import { cn } from "../lib/utils";

interface CodeBuddyLogoIconProps {
  className?: string;
}

export function CodeBuddyLogoIcon({ className }: CodeBuddyLogoIconProps) {
  return (
    <img
      src="/brands/codebuddy-icon.svg"
      alt="CodeBuddy"
      className={cn(className)}
    />
  );
}
