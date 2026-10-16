/**
 * Dados oficiais AFPG — época 2025/2026.
 *
 * Fonte: documentos oficiais publicados em afpguimaraes.com
 * (classificações, resultados de fim de semana e calendários em PDF).
 * Nada aqui é inventado: campos sem informação pública ficam vazios e
 * a estrutura está preparada para receber dados adicionais/API.
 */

import ataesCrest from "@/assets/crests/ataes.png";
import atleticoCostaCrest from "@/assets/crests/atletico-costa.png";
import calvosCrest from "@/assets/crests/calvos.png";
import estrelasCrest from "@/assets/crests/estrelas-vermelhas.png";
import pinheiroCrest from "@/assets/crests/pinheiro.png";
import saoFaustinoCrest from "@/assets/crests/sao-faustino.png";
import serzedoCrest from "@/assets/crests/serzedo.png";
import polvoreiraCrest from "@/assets/crests/polvoreira.png";

import superLigaMark from "@/assets/competitions/super-liga.png";
import tacaAssociacaoMark from "@/assets/competitions/taca-associacao.png";
import tacaCidadeBercoMark from "@/assets/competitions/taca-cidade-berco.png";
import tacaDisciplinaMark from "@/assets/competitions/taca-disciplina.png";
import trofeuJoaoFernandesMark from "@/assets/competitions/trofeu-joao-fernandes.png";

export const SEASON = "2026/2027";
export const PREVIOUS_SEASON = "2025/2026";
/** Início da época atual: jogos sem resultado anteriores a esta data não contam como próximos. */
export const SEASON_START = "2026-09-01";

export const ASSOCIATION = {
  name: "Associação de Futebol Popular de Guimarães",
  short: "AFPG",
  address: "Rua de Covas, 260 — Polvoreira, 4835-157 Guimarães",
  phone: "253 512 680",
  fax: "253 512 680",
  email: "geral.afpg@sapo.pt",
  site: "www.afpguimaraes.com",
};

export type Club = {
  slug: string;
  name: string;
  short: string;
  standingsName: string;
  initials: string;
  locality: string;
  crest: string;
  /** Cor identitária do clube (usada de forma subtil na página do clube). */
  color: string;
  colorLabel: string;
};

export const clubs: Club[] = [
  {
    slug: "atletico-costa",
    name: "C. Atlético Costa",
    short: "Atlético Costa",
    standingsName: "ATLÉTICO COSTA",
    initials: "CAC",
    locality: "Costa, Guimarães",
    crest: atleticoCostaCrest,
    color: "oklch(0.45 0.13 245)",
    colorLabel: "Azul e verde",
  },
  {
    slug: "ataes",
    name: "Atães F.C.",
    short: "Atães",
    standingsName: "ATÃES",
    initials: "AFC",
    locality: "Atães, Guimarães",
    crest: ataesCrest,
    color: "oklch(0.6 0.16 75)",
    colorLabel: "Amarelo, vermelho e negro",
  },
  {
    slug: "pinheiro",
    name: "C.D. Pinheiro",
    short: "Pinheiro",
    standingsName: "PINHEIRO",
    initials: "CDP",
    locality: "Pinheiro, Guimarães",
    crest: pinheiroCrest,
    color: "oklch(0.3 0.01 260)",
    colorLabel: "Negro e branco",
  },
  {
    slug: "serzedo",
    name: "G.C.D. Serzedo",
    short: "Serzedo",
    standingsName: "SERZEDO",
    initials: "GCDS",
    locality: "Serzedo, Guimarães",
    crest: serzedoCrest,
    color: "oklch(0.42 0.11 152)",
    colorLabel: "Verde, amarelo e vermelho",
  },
  {
    slug: "sao-faustino",
    name: "G.D. São Faustino",
    short: "S. Faustino",
    standingsName: "S. FAUSTINO",
    initials: "GDSF",
    locality: "São Faustino, Guimarães",
    crest: saoFaustinoCrest,
    color: "oklch(0.55 0.22 27)",
    colorLabel: "Vermelho e verde-claro",
  },
  {
    slug: "calvos",
    name: "A.R.D. Calvos",
    short: "Calvos",
    standingsName: "CALVOS",
    initials: "ARDC",
    locality: "Calvos, Guimarães",
    crest: calvosCrest,
    color: "oklch(0.5 0.13 150)",
    colorLabel: "Verde, amarelo e vermelho",
  },
  {
    slug: "estrelas-vermelhas",
    name: "S.C. Estrelas Vermelhas",
    short: "Estrelas Vermelhas",
    standingsName: "EST. VERMELHAS",
    initials: "SCEV",
    locality: "Souto Santa Maria, Guimarães",
    crest: estrelasCrest,
    color: "oklch(0.42 0.14 300)",
    colorLabel: "Violeta, dourado e vermelho",
  },
  {
    slug: "polvoreira",
    name: "Mais Polvoreira",
    short: "Polvoreira",
    standingsName: "POLVOREIRA",
    initials: "MP",
    locality: "Polvoreira, Guimarães",
    crest: polvoreiraCrest,
    color: "oklch(0.58 0.19 35)",
    colorLabel: "Vermelho e azul",
  },
];


export const clubBySlug = (slug: string) => clubs.find((c) => c.slug === slug);
export const clubByStandingsName = (name: string) =>
  clubs.find((c) => c.standingsName === name);

export type Competition = {
  slug: string;
  path: string;
  name: string;
  kind: "Liga" | "Taça" | "Prémio";
  mark: string;
  tagline: string;
  description: string;
  /** Página original no site institucional, quando existe. */
  sourceUrl?: string;
};

export const competitions: Competition[] = [
  {
    slug: "trofeu-joao-fernandes",
    path: "/trofeu-joao-fernandes",
    name: "Troféu João Fernandes",
    kind: "Taça",
    mark: trofeuJoaoFernandesMark,
    tagline: "O pontapé de saída da época",
    description:
      "Jogo único que abre a nova época e premeia as equipas com melhor fair play da época anterior.",
  },
  {
    slug: "super-liga",
    path: "/super-liga",
    name: "Super Liga",
    kind: "Liga",
    mark: superLigaMark,
    tagline: "1ª Divisão AFPG",
    description:
      "A principal competição da AFPG, disputada a duas voltas por todos os clubes filiados da 1ª Divisão.",
    sourceUrl: "https://www.afpguimaraes.com/super-liga",
  },
  {
    slug: "taca-associacao",
    path: "/taca-associacao",
    name: "Taça Associação",
    kind: "Taça",
    mark: tacaAssociacaoMark,
    tagline: "Competição a eliminar",
    description:
      "Taça da Associação disputada por eliminatórias entre os clubes filiados na AFPG.",
  },
  {
    slug: "taca-cidade-berco",
    path: "/taca-cidade-berco",
    name: "Taça Cidade Berço",
    kind: "Taça",
    mark: tacaCidadeBercoMark,
    tagline: "Eliminatórias a duas mãos",
    description:
      "A taça com o nome da Cidade Berço: quartos de final e meias-finais a duas mãos, com final em campo neutro.",
    sourceUrl: "https://www.afpguimaraes.com/taca-cidade-berco",
  },
  {
    slug: "taca-disciplina",
    path: "/taca-disciplina",
    name: "Taça de Disciplina",
    kind: "Prémio",
    mark: tacaDisciplinaMark,
    tagline: "Fair play AFPG",
    description:
      "Classificação disciplinar acumulada ao longo da época, publicada jornada a jornada.",
    sourceUrl: "https://www.afpguimaraes.com/taca-de-disciplina",
  },
];

export const competitionBySlug = (slug: string) =>
  competitions.find((c) => c.slug === slug);

export type StandingRow = {
  position: number;
  club: string; // slug
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};


/** Classificação final — Super Liga 1ª Divisão AFPG 2025/2026 (14ª jornada). */
export const previousSuperLigaStandings: StandingRow[] = [
  { position: 1, club: "atletico-costa", played: 12, wins: 10, draws: 2, losses: 0, goalsFor: 35, goalsAgainst: 11, points: 32 },
  { position: 2, club: "ataes", played: 12, wins: 6, draws: 4, losses: 2, goalsFor: 25, goalsAgainst: 19, points: 22 },
  { position: 3, club: "pinheiro", played: 12, wins: 6, draws: 1, losses: 5, goalsFor: 22, goalsAgainst: 19, points: 19 },
  { position: 4, club: "serzedo", played: 12, wins: 6, draws: 1, losses: 5, goalsFor: 21, goalsAgainst: 19, points: 19 },
  { position: 5, club: "sao-faustino", played: 12, wins: 5, draws: 2, losses: 5, goalsFor: 24, goalsAgainst: 28, points: 17 },
  { position: 6, club: "calvos", played: 12, wins: 3, draws: 2, losses: 7, goalsFor: 27, goalsAgainst: 35, points: 11 },
  { position: 7, club: "estrelas-vermelhas", played: 12, wins: 0, draws: 0, losses: 12, goalsFor: 12, goalsAgainst: 35, points: 0 },
];

export type Match = {
  id: string;
  competition: string; // slug
  round: string;
  date: string; // ISO
  time?: string;
  home: string; // slug
  away: string; // slug
  homeGoals?: number;
  awayGoals?: number;
  venue?: string;
  stage?: string;
};

type RawTeam = string;
const leg1: [string, [RawTeam, RawTeam][]][] = [
  ["2026-10-10", [["polvoreira","ataes"],["calvos","estrelas-vermelhas"],["sao-faustino","atletico-costa"],["serzedo","pinheiro"]]],
  ["2026-10-17", [["calvos","polvoreira"],["atletico-costa","ataes"],["estrelas-vermelhas","serzedo"],["pinheiro","sao-faustino"]]],
  ["2026-10-24", [["polvoreira","atletico-costa"],["serzedo","calvos"],["ataes","pinheiro"],["sao-faustino","estrelas-vermelhas"]]],
  ["2026-11-07", [["serzedo","polvoreira"],["pinheiro","atletico-costa"],["calvos","sao-faustino"],["estrelas-vermelhas","ataes"]]],
  ["2026-11-28", [["polvoreira","pinheiro"],["sao-faustino","serzedo"],["atletico-costa","estrelas-vermelhas"],["ataes","calvos"]]],
  ["2026-12-12", [["sao-faustino","polvoreira"],["estrelas-vermelhas","pinheiro"],["serzedo","ataes"],["calvos","atletico-costa"]]],
  ["2027-01-06", [["polvoreira","estrelas-vermelhas"],["ataes","sao-faustino"],["pinheiro","calvos"],["atletico-costa","serzedo"]]],
];
const leg2Dates = ["2027-01-30","2027-02-20","2027-03-13","2027-04-03","2027-04-17","2027-05-06","2027-05-15"];

/** Resultados oficiais da Super Liga 2026/2027 (id → [casa, fora]). */
const superLigaScores: Record<string, [number, number]> = {
  "sl-1-1": [2, 1],
  "sl-1-2": [2, 2],
  "sl-1-3": [0, 3],
  "sl-1-4": [1, 1],
};

const superLigaMatches: Match[] = [
  ...leg1.flatMap(([date, games], r) =>
    games.map(([home, away], i) => ({ id: `sl-${r + 1}-${i + 1}`, competition: "super-liga", round: `${r + 1}ª Jornada`, date, home, away })),
  ),
  ...leg1.flatMap(([, games], r) =>
    games.map(([home, away], i) => ({ id: `sl-${r + 8}-${i + 1}`, competition: "super-liga", round: `${r + 8}ª Jornada`, date: leg2Dates[r]!, home: away, away: home })),
  ),
].map((m) => {
  const s = superLigaScores[m.id];
  return s ? { ...m, homeGoals: s[0], awayGoals: s[1] } : m;
});

const cupLegs = (
  competition: string,
  prefix: string,
  q1: string,
  q2: string,
  ties: [string, string][],
): Match[] => [
  ...ties.map(([home, away], i) => ({ id: `${prefix}-qf1-${i + 1}`, competition, round: "Quartos de Final — 1ª Mão", stage: `Jogo ${i + 1}`, date: q1, home, away })),
  ...ties.map(([home, away], i) => ({ id: `${prefix}-qf2-${i + 1}`, competition, round: "Quartos de Final — 2ª Mão", stage: `Jogo ${i + 1}`, date: q2, home: away, away: home })),
];

/** Jogos da época 2026/2027 (com e sem resultado). */
export const matches: Match[] = [
  {
    id: "tjf-2026",
    competition: "trofeu-joao-fernandes",
    round: "Troféu João Fernandes",
    stage: "Final",
    date: "2026-10-03",
    home: "pinheiro",
    away: "atletico-costa",
    homeGoals: 3,
    awayGoals: 1,
  },
  ...superLigaMatches,
  ...cupLegs("taca-associacao", "ta", "2026-10-31", "2026-12-19", [
    ["ataes", "pinheiro"], ["atletico-costa", "polvoreira"], ["estrelas-vermelhas", "calvos"], ["sao-faustino", "serzedo"],
  ]),
  ...cupLegs("taca-cidade-berco", "tcb", "2026-11-21", "2027-01-23", [
    ["ataes", "atletico-costa"], ["estrelas-vermelhas", "serzedo"], ["polvoreira", "sao-faustino"], ["pinheiro", "calvos"],
  ]),
];

/** Classificação calculada a partir dos resultados da Super Liga. */
export const superLigaStandings: StandingRow[] = (() => {
  const table = new Map<string, StandingRow>();
  for (const club of ["ataes", "atletico-costa", "calvos", "estrelas-vermelhas", "pinheiro", "polvoreira", "sao-faustino", "serzedo"])
    table.set(club, { position: 0, club, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
  for (const m of superLigaMatches) {
    if (m.homeGoals === undefined || m.awayGoals === undefined) continue;
    const h = table.get(m.home)!, a = table.get(m.away)!;
    h.played++; a.played++;
    h.goalsFor += m.homeGoals; h.goalsAgainst += m.awayGoals;
    a.goalsFor += m.awayGoals; a.goalsAgainst += m.homeGoals;
    if (m.homeGoals > m.awayGoals) { h.wins++; a.losses++; h.points += 3; }
    else if (m.homeGoals < m.awayGoals) { a.wins++; h.losses++; a.points += 3; }
    else { h.draws++; a.draws++; h.points++; a.points++; }
  }
  return [...table.values()]
    .sort((x, y) => y.points - x.points || (y.goalsFor - y.goalsAgainst) - (x.goalsFor - x.goalsAgainst) || y.goalsFor - x.goalsFor || x.club.localeCompare(y.club))
    .map((r, i) => ({ ...r, position: i + 1 }));
})();

export const results = matches
  .filter((m) => m.homeGoals !== undefined)
  .sort((a, b) => b.date.localeCompare(a.date));

export const upcoming = matches
  .filter((m) => m.homeGoals === undefined && m.date >= SEASON_START)
  .sort((a, b) => a.date.localeCompare(b.date));

export type BracketTie = { home: string | null; away: string | null; homeLabel?: string; awayLabel?: string; note?: string };
export type BracketStage = { stage: string; date: string; ties: BracketTie[] };

const w = (n: number): string => `Vencedor jogo ${n}`;
const tbd = (h: number, a: number, note: string): BracketTie => ({ home: null, away: null, homeLabel: w(h), awayLabel: w(a), note });

/** Calendários oficiais das taças 2026/2027. */
export const cupBrackets: Record<string, BracketStage[]> = {
  "taca-associacao": [
    { stage: "Quartos de Final — 1ª Mão", date: "2026-10-31", ties: [
      { home: "ataes", away: "pinheiro", note: "Jogo 1" }, { home: "atletico-costa", away: "polvoreira", note: "Jogo 2" },
      { home: "estrelas-vermelhas", away: "calvos", note: "Jogo 3" }, { home: "sao-faustino", away: "serzedo", note: "Jogo 4" },
    ] },
    { stage: "Quartos de Final — 2ª Mão", date: "2026-12-19", ties: [
      { home: "pinheiro", away: "ataes", note: "Jogo 1" }, { home: "polvoreira", away: "atletico-costa", note: "Jogo 2" },
      { home: "calvos", away: "estrelas-vermelhas", note: "Jogo 3" }, { home: "serzedo", away: "sao-faustino", note: "Jogo 4" },
    ] },
    { stage: "Meias-Finais — 1ª Mão", date: "2027-02-13", ties: [tbd(4, 1, "Jogo 5"), tbd(3, 2, "Jogo 6")] },
    { stage: "Meias-Finais — 2ª Mão", date: "2027-03-27", ties: [tbd(1, 4, "Jogo 5"), tbd(2, 3, "Jogo 6")] },
    { stage: "Final", date: "2027-05-29", ties: [tbd(5, 6, "Jogo 7")] },
  ],
  "taca-cidade-berco": [
    { stage: "Quartos de Final — 1ª Mão", date: "2026-11-21", ties: [
      { home: "ataes", away: "atletico-costa", note: "Jogo 1" }, { home: "estrelas-vermelhas", away: "serzedo", note: "Jogo 2" },
      { home: "polvoreira", away: "sao-faustino", note: "Jogo 3" }, { home: "pinheiro", away: "calvos", note: "Jogo 4" },
    ] },
    { stage: "Quartos de Final — 2ª Mão", date: "2027-01-23", ties: [
      { home: "atletico-costa", away: "ataes", note: "Jogo 1" }, { home: "serzedo", away: "estrelas-vermelhas", note: "Jogo 2" },
      { home: "sao-faustino", away: "polvoreira", note: "Jogo 3" }, { home: "calvos", away: "pinheiro", note: "Jogo 4" },
    ] },
    { stage: "Meias-Finais — 1ª Mão", date: "2027-02-27", ties: [tbd(4, 3, "Jogo 5"), tbd(2, 1, "Jogo 6")] },
    { stage: "Meias-Finais — 2ª Mão", date: "2027-04-24", ties: [tbd(3, 4, "Jogo 5"), tbd(1, 2, "Jogo 6")] },
    { stage: "Final", date: "2027-06-05", ties: [tbd(5, 6, "Jogo 7")] },
  ],
};



export type Doc = {
  title: string;
  category: DocCategory;
  url: string;
  date?: string;
};

export type DocCategory =
  | "Comunicados"
  | "Conselho de Disciplina"
  | "Impressos AFPG"
  | "Impressos FFPN"
  | "Regulamentos"
  | "Secretaria"
  | "Interconcelhias FFPN"
  | "Super Liga"
  | "Taça Cidade Berço"
  | "Taça de Disciplina"
  | "Prémios";

export const docCategories: DocCategory[] = [
  "Comunicados",
  "Conselho de Disciplina",
  "Super Liga",
  "Taça Cidade Berço",
  "Taça de Disciplina",
  "Prémios",
  "Regulamentos",
  "Impressos AFPG",
  "Impressos FFPN",
  "Secretaria",
  "Interconcelhias FFPN",
];

const S = "https://www.afpguimaraes.com/s/";
const P = "https://www.afpguimaraes.com/";

export const documents: Doc[] = [
  // Super Liga
  { title: "Calendário Super Liga 1ª Divisão 2025/2026", category: "Super Liga", url: `${S}Calendario-SUPERLIGA-1a-Divisao-2025-2026-E-GERAL-afg4.pdf` },
  { title: "Reajuste do Calendário Geral — 3 de fevereiro de 2026", category: "Super Liga", url: `${S}REAJUSTE-do-Calendario-Geral-Epoca-2025-2026-3-de-fevereiro-2026.pdf` },
  { title: "Agenda de fim de semana — 14ª Jornada", category: "Super Liga", url: `${S}agenda-fim-de-semana-25-26-14-JORNADA.pdf` },
  { title: "Classificação Super Liga — 14ª Jornada (final)", category: "Super Liga", url: `${S}Classificacao-14-JORNADA-SUPERLIGA-1a-Divisao-2025-2026.pdf` },
  { title: "Classificação Super Liga — 13ª Jornada", category: "Super Liga", url: `${S}Classificacao-13-JORNADA-SUPERLIGA-1a-Divisao-2025-2026.pdf` },
  { title: "Classificação Super Liga — 12ª Jornada", category: "Super Liga", url: `${S}Classificacao-12-JORNADA-SUPERLIGA-1a-Divisao-2025-2026.pdf` },
  { title: "Resultados de fim de semana — 14ª Jornada", category: "Super Liga", url: `${S}Resultados-fim-de-semana-25-26-14-JORNADA.pdf` },
  { title: "Resultados de fim de semana — 13ª Jornada", category: "Super Liga", url: `${S}Resultados-fim-de-semana-25-26-13-JORNADA.pdf` },
  { title: "Resultados de fim de semana — 12ª Jornada", category: "Super Liga", url: `${S}Resultados-fim-de-semana-25-26-12-JORNADA-fmzj.pdf` },

  // Taça Cidade Berço
  { title: "Calendário Taça Cidade Berço 2025/2026 (completo)", category: "Taça Cidade Berço", url: `${S}Calendario-Taca-Cidade-Berco-2025-2026-COMPLETA.pdf` },
  { title: "Taça Cidade Berço — Final 2025/2026", category: "Taça Cidade Berço", url: `${S}Calendario-Taca-Cidade-Berco-FINAL-2025-2026.pdf` },
  { title: "Meias-Finais 1ª Mão — calendário", category: "Taça Cidade Berço", url: `${S}Calendario-Taca-Cidade-Berco-1-MO-MEIAS-FINAIS-2025-2026-Copia.pdf` },
  { title: "Meias-Finais 2ª Mão — resultado", category: "Taça Cidade Berço", url: `${S}resultado-Taca-Cidade-Berco-2-MO-MEIAS-FINAIS-2025-2026.pdf` },
  { title: "Quartos de Final 2ª Mão — resultado", category: "Taça Cidade Berço", url: `${S}resultado-Taca-Cidade-Berco-2-MO-QUARTOS-FINAIS-2025-2026-Copia.pdf` },

  // Taça de Disciplina
  { title: "Classificação Disciplina — até à 14ª Jornada", category: "Taça de Disciplina", url: `${S}Classificacao-Disciplina-14-JORNADAmeias-finais-taca-cb-2025-2026-Copia.pdf` },
  { title: "Classificação Disciplina — até à 13ª Jornada", category: "Taça de Disciplina", url: `${S}Classificacao-Disciplina-13-JORNADAmeias-finais-taca-cb-2025-2026.pdf` },
  { title: "Classificação Disciplina — até à 12ª Jornada", category: "Taça de Disciplina", url: `${S}Classificacao-Disciplina-12-JORNADAmeias-finais-taca-cb-2025-2026.pdf` },
  { title: "Classificação Disciplina — até à 10ª Jornada", category: "Taça de Disciplina", url: `${S}Classificacao-Disciplina-10-JORNADA-2025-2026.pdf` },

  // Prémios individuais
  { title: "Melhor Marcador — classificação final (14ª jornada)", category: "Prémios", url: `${P}melhor-marcador` },
  { title: "Melhor Jogador — classificação final (14ª jornada)", category: "Prémios", url: `${P}melhor-jogador` },

  // Institucional
  { title: "Regulamentos AFPG", category: "Regulamentos", url: `${P}regulamentos-afpg` },
  { title: "Impressos AFPG", category: "Impressos AFPG", url: `${P}impressos-afpg` },
  { title: "Impressos FFPN", category: "Impressos FFPN", url: `${P}impressos-ffpn` },
  { title: "Secretaria — informação e horários", category: "Secretaria", url: `${P}secretaria` },
  { title: "Conselho de Disciplina — comunicados", category: "Conselho de Disciplina", url: `${P}conselho-de-disciplina` },
  { title: "Interconcelhias FFPN", category: "Interconcelhias FFPN", url: `${P}interconcelhias-ffpn` },
  { title: "Agenda semanal", category: "Comunicados", url: `${P}agenda-semanal` },
];

/** Estatísticas de equipa derivadas da classificação oficial. */
export const clubStats = (slug: string) =>
  superLigaStandings.find((r) => r.club === slug);

export const clubMatches = (slug: string) =>
  matches.filter((m) => m.home === slug || m.away === slug);

export const clubForm = (slug: string) =>
  results
    .filter((m) => m.home === slug || m.away === slug)
    .slice(0, 5)
    .map((m) => {
      const isHome = m.home === slug;
      const gf = isHome ? m.homeGoals! : m.awayGoals!;
      const ga = isHome ? m.awayGoals! : m.homeGoals!;
      return gf > ga ? "V" : gf === ga ? "E" : "D";
    });

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const formatShortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
  });
