import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPEAKING_AUDIO_BUCKET } from "@/lib/speaking/storage";
import type { SpeakingExam } from "@/lib/speaking/exams";
import type {
  SpeakingTopic,
  SpeakingQuestion,
  SpeakingHint,
  SpeakingImage,
  SpeakingSubmission,
} from "@/lib/speaking/types";

export async function listTopicsByExam(exam: SpeakingExam): Promise<SpeakingTopic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("speaking_topics")
    .select("*")
    .eq("exam", exam)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTopicBySlug(slug: string): Promise<SpeakingTopic | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("speaking_topics")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getQuestions(topicId: string): Promise<SpeakingQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("speaking_questions")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getHints(topicId: string): Promise<SpeakingHint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("speaking_hints")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getImages(topicId: string): Promise<SpeakingImage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("speaking_images")
    .select("*")
    .eq("topic_id", topicId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Private bucket — recordings are personal, so playback always goes through a short-lived signed URL from the service-role client rather than a public path. */
export async function getSpeakingAudioUrl(path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(SPEAKING_AUDIO_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

/** Most recent whole-topic submission (cue-card / images formats — question_id is null) for the current user, with a fresh signed playback URL attached. */
export async function getMySubmission(
  topicId: string,
): Promise<(SpeakingSubmission & { audio_url: string | null }) | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("speaking_submissions")
    .select("*")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .is("question_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const audio_url = await getSpeakingAudioUrl(data.audio_path);
  return { ...data, audio_url };
}

/** Latest per-question submission for the current user on this topic (qa format), keyed by question_id, each with a fresh signed playback URL. */
export async function getMyQuestionSubmissions(
  topicId: string,
): Promise<Map<string, SpeakingSubmission & { audio_url: string | null }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Map();

  const { data } = await supabase
    .from("speaking_submissions")
    .select("*")
    .eq("topic_id", topicId)
    .eq("user_id", user.id)
    .not("question_id", "is", null)
    .order("created_at", { ascending: true });

  const map = new Map<string, SpeakingSubmission & { audio_url: string | null }>();
  for (const row of data ?? []) {
    const audio_url = await getSpeakingAudioUrl(row.audio_path);
    map.set(row.question_id as string, { ...row, audio_url });
  }
  return map;
}
