import type { Doc } from "@/lib/api";

export function DocumentList({ docs }: { docs: Doc[] }) {
  if (docs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
        Sem documentos publicados nesta categoria.
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {docs.map((doc) => (
        <li key={doc.id}>
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="group grid grid-cols-[minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift sm:flex sm:flex-nowrap sm:justify-between sm:gap-4"
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M14 3v5h5" />
                  <path d="M6 3h8l5 5v13H6z" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{doc.title}</span>
                <span className="eyebrow block text-muted-foreground">{doc.category}</span>
              </span>
            </span>
            <span className="eyebrow shrink-0 text-primary transition-transform group-hover:translate-x-0.5">
              Abrir documento →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
