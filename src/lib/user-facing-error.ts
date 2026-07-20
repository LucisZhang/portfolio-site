import { localizeStructuralValue } from "./structural-copy";

const USER_FACING_ERROR_MESSAGES = Object.freeze({
  dataset: "Dataset unavailable.",
  evidence: "Evidence could not be loaded.",
  invalidJson: "Invalid JSON.",
  registry: "Claim registry could not be loaded.",
});

export type UserFacingErrorKey = keyof typeof USER_FACING_ERROR_MESSAGES;

/**
 * Error objects and provider/browser messages are not display copy. Callers retain the technical
 * value in console.error and pass only a finite domain key through this fail-closed display map.
 */
export function userFacingError(
  key: UserFacingErrorKey | string,
  locale: "en" | "zh",
  fallback: UserFacingErrorKey = "evidence",
) {
  const message = Object.hasOwn(USER_FACING_ERROR_MESSAGES, key)
    ? USER_FACING_ERROR_MESSAGES[key as UserFacingErrorKey]
    : USER_FACING_ERROR_MESSAGES[fallback];
  return localizeStructuralValue(message, locale);
}

export const USER_FACING_ERROR_KEYS = Object.freeze(Object.keys(USER_FACING_ERROR_MESSAGES) as UserFacingErrorKey[]);
