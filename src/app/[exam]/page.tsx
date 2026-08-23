import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, BookOpen, Mic } from "lucide-react";
import { isExam } from "@/lib/exam";
import { SPEAKING_EXAMS } from "@/lib/speaking/exams";

const WINDOWS = [
  {
    key: "listening",
    name: "Listening",
    tagline: "Exam-focused audio clips and vocab practice",
    icon: Headphones,
    gradient: "from-sky-400 to-blue-600",
    href: (exam: string) => `/${exam}/listening`,
  },
  {
    key: "reading",
    name: "Reading",
    tagline: "Exam-focused passages and vocab practice",
    icon: BookOpen,
    gradient: "from-emerald-400 to-teal-600",
    href: (exam: string) => `/${exam}/reading`,
  },
  {
    key: "speaking",
    name: "Speaking",
    tagline: "Parts, topics, and guided questions",
    icon: Mic,
    gradient: "from-rose-400 to-pink-600",
    href: (exam: string) => `/speaking/${exam}`,
  },
];

export default async function ExamHubPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  if (!isExam(exam)) notFound();

  const label = SPEAKING_EXAMS[exam].label;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{label}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
          Pick a skill to start practicing for {label}.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {WINDOWS.map((w) => {
          const Icon = w.icon;
          return (
            <Link
              key={w.key}
              href={w.href(exam)}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${w.gradient} text-white shadow-sm`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{w.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{w.tagline}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-slate-400 transition group-hover:text-indigo-600">
                Explore &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
