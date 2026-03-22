export const PUBLIC_PRODUCT_NAME = "RunEach";
export const PUBLIC_CLI_NAME = "runeach";
export const PUBLIC_NPM_PACKAGE_NAME = "runeach";

export function publicCliCommand(command = ""): string {
  return [PUBLIC_CLI_NAME, command].filter(Boolean).join(" ");
}
