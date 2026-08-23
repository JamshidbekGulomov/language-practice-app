export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

/** Matches a public channel post link like t.me/channelname/123. */
function extractTelegramPost(url: string): string | null {
  const match = url.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/);
  return match ? `${match[1]}/${match[2]}` : null;
}

export type VideoEmbed =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "telegram"; postPath: string }
  | null;

export function getVideoEmbed(url: string): VideoEmbed {
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}` };
  }

  const telegramPost = extractTelegramPost(url);
  if (telegramPost) {
    return { kind: "telegram", postPath: telegramPost };
  }

  return null;
}
