export const SPEAKING_AUDIO_BUCKET = "speaking-audio";
export const SPEAKING_IMAGES_BUCKET = "speaking-images";

/** Public bucket — exam images are admin-authored content, not personal data, so they're served straight from this deterministic URL. */
export function getSpeakingImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${SPEAKING_IMAGES_BUCKET}/${path}`;
}
