import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import {
  AdminSection,
  Field,
  ImageField,
  QueryState,
  confirmDelete,
  inputClass,
  useAdminMutation,
} from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { adminQueries } from "@/lib/admin-queries";
import { api, type AdminArticle, type ArticleKind } from "@/lib/api";

export const Route = createFileRoute("/admin/noticias/$id")({ component: ArticleEditorPage });

function ArticleEditorPage() {
  const { id } = Route.useParams();
  const isNew = id === "nova";
  const article = useQuery({ ...adminQueries.article(Number(id)), enabled: !isNew });

  if (isNew) return <ArticleEditor />;
  if (!article.data) return <QueryState isLoading={article.isLoading} error={article.error} />;
  return <ArticleEditor key={article.data.updatedAt} article={article.data} />;
}

type Form = {
  title: string;
  slug: string;
  kind: ArticleKind;
  summary: string;
  body: string;
  coverUrl: string | null;
  /** datetime-local value in the browser's zone; empty = publish now. */
  publishAt: string;
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

function ArticleEditor({ article }: { article?: AdminArticle }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    kind: article?.kind ?? "news",
    summary: article?.summary ?? "",
    body: article?.body ?? "",
    coverUrl: article?.coverUrl ?? null,
    publishAt: toLocalInput(article?.publishedAt ?? null),
  });
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const payload = (status: "draft" | "published") => ({
    title: form.title,
    ...(form.slug ? { slug: form.slug } : {}),
    kind: form.kind,
    summary: form.summary,
    body: form.body,
    coverUrl: form.coverUrl,
    status,
    publishedAt: form.publishAt
      ? new Date(form.publishAt).toISOString()
      : status === "draft"
        ? null
        : undefined,
  });

  const invalidate = [
    ["admin", "articles"],
    ...(article ? [["admin", "article", article.id]] : []),
  ];
  const save = useAdminMutation(
    (status: "draft" | "published") =>
      article
        ? api.patch<AdminArticle>(`/api/admin/articles/${article.id}`, payload(status))
        : api.post<AdminArticle>("/api/admin/articles", payload(status)),
    {
      invalidate,
      public: true,
      success: "Notícia guardada.",
      onSuccess: (saved) => {
        if (!article)
          void navigate({ to: "/admin/noticias/$id", params: { id: String(saved.id) } });
      },
    },
  );
  const remove = useAdminMutation(() => api.delete(`/api/admin/articles/${article!.id}`), {
    invalidate: [["admin", "articles"]],
    public: true,
    success: "Notícia apagada.",
    onSuccess: () => void navigate({ to: "/admin/noticias" }),
  });

  function submit(e: FormEvent, status: "draft" | "published") {
    e.preventDefault();
    save.mutate(status);
  }

  return (
    <>
      <Link to="/admin/noticias" className="eyebrow text-primary hover:underline">
        ← Notícias
      </Link>
      <AdminSection
        title={article ? "Editar notícia" : "Nova notícia"}
        actions={
          article?.status === "published" && (
            <Link
              to="/noticias/$slug"
              params={{ slug: article.slug }}
              className="eyebrow text-primary hover:underline"
            >
              Ver no site →
            </Link>
          )
        }
      >
        <form onSubmit={(e) => submit(e, "published")} className="grid gap-5">
          <Field label="Título">
            {(id) => (
              <input
                id={id}
                required
                maxLength={200}
                className={inputClass}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tipo">
              {(id) => (
                <select
                  id={id}
                  className={inputClass}
                  value={form.kind}
                  onChange={(e) => set("kind", e.target.value as ArticleKind)}
                >
                  <option value="news">Notícia</option>
                  <option value="announcement">Comunicado</option>
                </select>
              )}
            </Field>
            <Field label="Endereço (slug)" hint="Vazio = gerado a partir do título.">
              {(id) => (
                <input
                  id={id}
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                />
              )}
            </Field>
            <Field label="Publicar em" hint="Vazio = agora. No futuro = agendada.">
              {(id) => (
                <input
                  id={id}
                  type="datetime-local"
                  className={inputClass}
                  value={form.publishAt}
                  onChange={(e) => set("publishAt", e.target.value)}
                />
              )}
            </Field>
          </div>
          <Field label="Resumo">
            {(id) => (
              <textarea
                id={id}
                rows={2}
                maxLength={500}
                className={`${inputClass} py-2`}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            )}
          </Field>
          <Field label="Texto" hint="Separe parágrafos com uma linha em branco.">
            {(id) => (
              <textarea
                id={id}
                required
                rows={14}
                className={`${inputClass} py-2 leading-relaxed`}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
              />
            )}
          </Field>
          <ImageField
            label="Imagem de capa"
            value={form.coverUrl}
            onChange={(v) => set("coverUrl", v)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {article ? (
              <Button
                type="button"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => confirmDelete("esta notícia") && remove.mutate(undefined)}
              >
                Apagar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={(e) => submit(e, "draft")}
              >
                Guardar rascunho
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {article?.status === "published" ? "Guardar" : "Publicar"}
              </Button>
            </div>
          </div>
        </form>
      </AdminSection>
    </>
  );
}
