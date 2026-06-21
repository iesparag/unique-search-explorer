import crypto from 'crypto';

/**
 * Compute SHA256 hash of input string.
 * @param {string} content
 * @returns {string} hex hash string
 */
export function hashContent(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}
