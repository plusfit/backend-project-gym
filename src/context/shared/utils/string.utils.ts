/**
 * Converts a string to Title Case (e.g., "john doe" -> "John Doe").
 * Handles multiple spaces, leading/trailing whitespace, and ensures all other letters are lowercase.
 * 
 * @param str The string to convert
 * @returns The converted string in Title Case
 */
export const toTitleCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
