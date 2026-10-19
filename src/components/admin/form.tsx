import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useId, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";

export const inputClass =
  "min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </Label>
      {children(id)}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "Não foi possível comunicar com o servidor.";

/**
 * Mutation that toasts on success/failure and refreshes what it changed:
 * the given admin queries, plus public loader data (catalog, pages) when `public` is set.
 */
export function useAdminMutation<TInput, TResult>(
  fn: (input: TInput) => Promise<TResult>,
  options: {
    invalidate?: QueryKey[];
    success?: string;
    public?: boolean;
    onSuccess?: (result: TResult) => void;
  } = {},
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (result) => {
      await Promise.all(
        (options.invalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
      if (options.public) {
        await queryClient.invalidateQueries({ queryKey: ["catalog"] });
        void router.invalidate();
      }
      if (options.success) toast.success(options.success);
      options.onSuccess?.(result);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <Field label={label} hint="PNG, JPEG ou WebP até 5 MB, ou cole um endereço.">
      {(id) => (
        <div className="flex flex-wrap items-center gap-3">
          {value && (
            <img
              src={value}
              alt=""
              className="size-14 rounded-md border border-border object-contain"
            />
          )}
          <input
            id={id}
            className={`${inputClass} flex-1`}
            value={value ?? ""}
            placeholder="https://… ou /api/media/…"
            onChange={(e) => onChange(e.target.value || null)}
          />
          <label className="eyebrow inline-flex min-h-10 cursor-pointer items-center rounded-md border border-border px-3 hover:border-primary/50">
            {uploading ? "A enviar…" : "Carregar"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploading(true);
                try {
                  onChange((await api.upload(file)).url);
                } catch (error) {
                  toast.error(errorMessage(error));
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        </div>
      )}
    </Field>
  );
}

export function AdminSection({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold uppercase">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function QueryState({ isLoading, error }: { isLoading: boolean; error: unknown }) {
  if (isLoading) return <p className="text-sm text-muted-foreground">A carregar…</p>;
  if (error) return <p className="text-sm text-destructive">{errorMessage(error)}</p>;
  return null;
}

/** Native confirm is enough for an admin tool and keeps destructive actions explicit. */
export const confirmDelete = (what: string) =>
  window.confirm(`Apagar ${what}? Esta ação não pode ser anulada.`);
