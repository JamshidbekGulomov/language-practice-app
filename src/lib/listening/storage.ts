export const LISTENING_AUDIO_BUCKET = "listening-audio";

/** Public bucket — files are served straight from this deterministic URL, no signing needed to read. */
export function getAudioPublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${LISTENING_AUDIO_BUCKET}/${path}`;
}
