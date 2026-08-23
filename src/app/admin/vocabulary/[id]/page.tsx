import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VocabWordsTable } from "@/components/admin/vocab/vocab-words-table";
import { WordUploadForm } from "@/components/admin/vocab/word-upload-form";
import { WordForm } from "@/components/admin/vocab/word-form";
import { deleteWord } from "@/app/admin/vocabulary/actions";
import type { VocabCategory, VocabWord } from "@/lib/vocabulary/types";

export default async function AdminVocabCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [categoryRows, words] = await Promise.all([
    adminList<VocabCategory>("vocab_categories", { eq: { id } }),
    adminList<VocabWord>("vocab_words", {
      eq: { category_id: id },
      orderBy: "created_at",
      ascending: false,
    }),
  ]);

  const category = categoryRows[0];
  if (!category) notFound();

  return (
    <div>
      <AdminPageHeader title={category.name} description={`${words.length} word(s)`} />

      <WordUploadForm categoryId={id} />

      <WordForm categoryId={id} />

      <div className="mt-6">
        <VocabWordsTable rows={words} onDelete={deleteWord.bind(null, id)} />
      </div>
    </div>
  );
}
