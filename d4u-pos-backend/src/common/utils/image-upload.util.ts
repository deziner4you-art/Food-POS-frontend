import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';

export const THUMBNAIL_SIZE = 300;

/** Generates an aspect-ratio-preserving thumbnail (max THUMBNAIL_SIZE x THUMBNAIL_SIZE) into destDir. */
export async function generateThumbnail(sourcePath: string, destDir: string, thumbnailFilename: string) {
  await sharp(sourcePath)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'inside', withoutEnlargement: true })
    .toFile(join(destDir, thumbnailFilename));
}

/** Deletes a previously-uploaded file given its public /uploads/... URL path, ignoring missing files. */
export async function deleteUploadedFile(dir: string, urlPath?: string | null) {
  if (!urlPath) return;
  const filename = urlPath.split('/').pop();
  if (!filename) return;
  try {
    await fs.unlink(join(dir, filename));
  } catch {
    // File already gone / never existed — nothing to clean up.
  }
}
