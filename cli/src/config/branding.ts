export const PUBLIC_PRODUCT_NAME = "Chopsticks";
export const PUBLIC_CLI_NAME = "chopsticks";
export const PUBLIC_NPM_PACKAGE_NAME = "chopsticks";

export function publicCliCommand(command = ""): string {
  return [PUBLIC_CLI_NAME, command].filter(Boolean).join(" ");
}
