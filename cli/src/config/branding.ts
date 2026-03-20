export const PUBLIC_PRODUCT_NAME = "Abacus";
export const PUBLIC_CLI_NAME = "abacus";
export const PUBLIC_NPM_PACKAGE_NAME = "abacus";

export function publicCliCommand(command = ""): string {
  return [PUBLIC_CLI_NAME, command].filter(Boolean).join(" ");
}
