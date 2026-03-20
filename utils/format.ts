
/**
 * Transforms a string to Title Case (e.g., "JOHN DOE" -> "John Doe").
 * Preserves spaces and applies capitalization to the first letter of each word.
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
