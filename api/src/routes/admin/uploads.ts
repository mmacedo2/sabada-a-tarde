import { Hono } from "hono";

import type { AppEnv } from "../../env";
import { audit } from "../../lib/audit";
import { HttpError } from "../../lib/http";

export const uploadRoutes = new Hono<AppEnv>();

const MAX_BYTES = 5 * 1024 * 1024;

/** Detect the type from the file's bytes; the client-declared type is not trusted. */
function sniffImage(bytes: Uint8Array): { ext: string; type: string } | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { ext: "png", type: "image/png" };
  if (starts([0xff, 0xd8, 0xff])) return { ext: "jpg", type: "image/jpeg" };
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8))
    return { ext: "webp", type: "image/webp" };
  return null;
}

uploadRoutes.post("/", async (c) => {
  const declared = Number(c.req.header("content-length"));
  if (declared > MAX_BYTES + 64 * 1024)
    throw new HttpError(413, "Imagem demasiado grande (máximo 5 MB).");

  const form = await c.req.formData().catch(() => {
    throw new HttpError(400, "Envie a imagem num formulário multipart com o campo 'file'.");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Envie a imagem no campo 'file'.");
  if (file.size > MAX_BYTES) throw new HttpError(413, "Imagem demasiado grande (máximo 5 MB).");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = sniffImage(bytes);
  if (!image) throw new HttpError(415, "Formato não suportado. Use PNG, JPEG ou WebP.");

  const key = `uploads/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${image.ext}`;
  await c.env.MEDIA.put(key, bytes, { httpMetadata: { contentType: image.type } });
  await audit(c, "create", "upload", null, { key, bytes: file.size });
  return c.json({ url: `/api/media/${key}` }, 201);
});
