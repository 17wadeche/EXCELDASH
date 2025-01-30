// src/taskpane/utils/stringUtils.ts

/**
 * Capitalizes the first letter of the given string.
 * @param s The string to capitalize.
 * @returns The capitalized string.
 */
export const capitalizeFirstLetter = (s: string): string => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};
