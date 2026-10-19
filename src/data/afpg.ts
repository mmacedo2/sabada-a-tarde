/** Static AFPG contact details. Everything else comes from the API (src/lib/api.ts). */
export const ASSOCIATION = {
  name: "Associação de Futebol Popular de Guimarães",
  short: "AFPG",
  address: "Rua de Covas, 260 — Polvoreira, 4835-157 Guimarães",
  phone: "253 512 680",
  fax: "253 512 680",
  email: "geral.afpg@sapo.pt",
};

export const formatDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const formatShortDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
  });

/** UTC timestamp shown in Portugal's time zone, whatever the server or browser zone. */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
