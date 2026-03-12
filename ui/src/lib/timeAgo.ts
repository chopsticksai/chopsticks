import { formatRelativeTimeValue } from "./i18n";

export function timeAgo(date: Date | string): string {
  return formatRelativeTimeValue(date);
}
