export function PageHeader({
  eyebrow,
  title,
  description,
  mark,
  children,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  mark?: string | undefined;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-ink-border bg-ink text-ink-foreground">
      <div className="pitch-lines">
        <div className="container-afpg flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between md:py-20">
          <div className="max-w-2xl animate-fade-up">
            {eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}
            <h1 className="mt-3 font-display text-4xl font-extrabold uppercase leading-[0.95] md:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
            {children && <div className="mt-7">{children}</div>}
          </div>
          {mark && (
            <img
              src={mark}
              alt=""
              loading="lazy"
              width={1024}
              height={768}
              className="h-28 w-auto self-start object-contain md:h-40"
            />
          )}
        </div>
      </div>
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string | undefined;
  title: string;
  action?: React.ReactNode | undefined;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}
        <h2 className="mt-1.5 font-display text-2xl font-extrabold uppercase md:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
