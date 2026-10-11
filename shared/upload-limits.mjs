/**
 * Upload limits enforced by the Worker and shown by the upload page. The page
 * checks them first so a doomed file fails instantly; the Worker is the check
 * that counts.
 */

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
/** Total size of a ZIP's contents once unpacked. */
export const MAX_DECOMPRESSED_SIZE = 100 * 1024 * 1024;
export const MAX_ZIP_FILES = 500;
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip"];
