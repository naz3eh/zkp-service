/**
 * Utility functions for the frontend
 */

const HASH_DISPLAY_LENGTH = 20

/**
 * Truncate a hash string for display
 * @param hash - The full hash string
 * @param length - Number of characters to show (default: 20)
 * @returns Truncated hash with ellipsis
 */
export function truncateHash(hash: string, length: number = HASH_DISPLAY_LENGTH): string {
  if (!hash || hash.length <= length) {
    return hash
  }
  return `${hash.slice(0, length)}...`
}

/**
 * Format a timestamp for display
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}
