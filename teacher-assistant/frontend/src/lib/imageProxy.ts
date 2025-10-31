/**
 * Image Proxy Utility
 *
 * Proxies InstantDB S3 image requests through the backend to avoid CORS issues.
 * Frontend requests images via `/api/storage-proxy?url=<s3-url>` and the backend
 * fetches and returns the image with proper CORS headers.
 */

/**
 * Check if a URL is an InstantDB S3 URL that needs proxying
 */
export function isS3ImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('instant-storage.s3.amazonaws.com');
}

/**
 * Transform S3 URL to proxied URL via backend
 *
 * @param s3Url - The original S3 URL
 * @returns Proxied URL through backend, or original URL if not S3
 *
 * @example
 * // Input: https://instant-storage.s3.amazonaws.com/...
 * // Output: /api/storage-proxy?url=https%3A%2F%2Finstant-storage.s3.amazonaws.com%2F...
 */
export function getProxiedImageUrl(s3Url: string | undefined): string {
  if (!s3Url) return '';

  // Only proxy InstantDB S3 URLs
  if (isS3ImageUrl(s3Url)) {
    return `/api/storage-proxy?url=${encodeURIComponent(s3Url)}`;
  }

  // Return as-is for non-S3 URLs (data URLs, relative paths, etc.)
  return s3Url;
}
