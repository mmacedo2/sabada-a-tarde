-- Starter data for the 2026/2027 season, taken from the official AFPG documents
-- previously hard-coded in the frontend (src/data/afpg.ts). Safe to re-run:
-- reference rows are INSERT OR IGNORE, and fixtures/documents are only
-- inserted into empty tables.

INSERT OR IGNORE INTO seasons (name, starts_on, ends_on, is_current) VALUES ('2026/2027', '2026-09-01', '2027-06-30', 1);

INSERT OR IGNORE INTO clubs (slug, name, short_name, initials, locality, crest_url, color, color_label) VALUES
  ('atletico-costa', 'C. Atlético Costa', 'Atlético Costa', 'CAC', 'Costa, Guimarães', '/crests/atletico-costa.png', 'oklch(0.45 0.13 245)', 'Azul e verde'),
  ('ataes', 'Atães F.C.', 'Atães', 'AFC', 'Atães, Guimarães', '/crests/ataes.png', 'oklch(0.6 0.16 75)', 'Amarelo, vermelho e negro'),
  ('pinheiro', 'C.D. Pinheiro', 'Pinheiro', 'CDP', 'Pinheiro, Guimarães', '/crests/pinheiro.png', 'oklch(0.3 0.01 260)', 'Negro e branco'),
  ('serzedo', 'G.C.D. Serzedo', 'Serzedo', 'GCDS', 'Serzedo, Guimarães', '/crests/serzedo.png', 'oklch(0.42 0.11 152)', 'Verde, amarelo e vermelho'),
  ('sao-faustino', 'G.D. São Faustino', 'S. Faustino', 'GDSF', 'São Faustino, Guimarães', '/crests/sao-faustino.png', 'oklch(0.55 0.22 27)', 'Vermelho e verde-claro'),
  ('calvos', 'A.R.D. Calvos', 'Calvos', 'ARDC', 'Calvos, Guimarães', '/crests/calvos.png', 'oklch(0.5 0.13 150)', 'Verde, amarelo e vermelho'),
  ('estrelas-vermelhas', 'S.C. Estrelas Vermelhas', 'Estrelas Vermelhas', 'SCEV', 'Souto Santa Maria, Guimarães', '/crests/estrelas-vermelhas.png', 'oklch(0.42 0.14 300)', 'Violeta, dourado e vermelho'),
  ('polvoreira', 'Mais Polvoreira', 'Polvoreira', 'MP', 'Polvoreira, Guimarães', '/crests/polvoreira.png', 'oklch(0.58 0.19 35)', 'Vermelho e azul');

INSERT OR IGNORE INTO competitions (slug, name, kind, tagline, description, logo_url, source_url, position) VALUES
  ('trofeu-joao-fernandes', 'Troféu João Fernandes', 'cup', 'O pontapé de saída da época', 'Jogo único que abre a nova época e premeia as equipas com melhor fair play da época anterior.', '/competitions/trofeu-joao-fernandes.png', NULL, 0),
  ('super-liga', 'Super Liga', 'league', '1ª Divisão AFPG', 'A principal competição da AFPG, disputada a duas voltas por todos os clubes filiados da 1ª Divisão.', '/competitions/super-liga.png', NULL, 1),
  ('taca-associacao', 'Taça Associação', 'cup', 'Competição a eliminar', 'Taça da Associação disputada por eliminatórias entre os clubes filiados na AFPG.', '/competitions/taca-associacao.png', NULL, 2),
  ('taca-cidade-berco', 'Taça Cidade Berço', 'cup', 'Eliminatórias a duas mãos', 'A taça com o nome da Cidade Berço: quartos de final e meias-finais a duas mãos, com final em campo neutro.', '/competitions/taca-cidade-berco.png', NULL, 3),
  ('taca-disciplina', 'Taça de Disciplina', 'award', 'Fair play AFPG', 'Classificação disciplinar acumulada ao longo da época, publicada jornada a jornada.', '/competitions/taca-disciplina.png', NULL, 4);

INSERT INTO games (season_id, competition_id, round, stage, home_club_id, away_club_id,
                   home_placeholder, away_placeholder, date, status, home_goals, away_goals)
SELECT s.id, co.id, v.column2, v.column3, hc.id, ac.id, v.column6, v.column7, v.column8, v.column9, v.column10, v.column11
  FROM (VALUES
    ('trofeu-joao-fernandes', 'Troféu João Fernandes', 'Final', 'pinheiro', 'atletico-costa', NULL, NULL, '2026-10-03', 'finished', 3, 1),
    ('super-liga', '1ª Jornada', NULL, 'polvoreira', 'ataes', NULL, NULL, '2026-10-10', 'finished', 2, 1),
    ('super-liga', '1ª Jornada', NULL, 'calvos', 'estrelas-vermelhas', NULL, NULL, '2026-10-10', 'finished', 2, 2),
    ('super-liga', '1ª Jornada', NULL, 'sao-faustino', 'atletico-costa', NULL, NULL, '2026-10-10', 'finished', 0, 3),
    ('super-liga', '1ª Jornada', NULL, 'serzedo', 'pinheiro', NULL, NULL, '2026-10-10', 'finished', 1, 1),
    ('super-liga', '2ª Jornada', NULL, 'calvos', 'polvoreira', NULL, NULL, '2026-10-17', 'scheduled', NULL, NULL),
    ('super-liga', '2ª Jornada', NULL, 'atletico-costa', 'ataes', NULL, NULL, '2026-10-17', 'scheduled', NULL, NULL),
    ('super-liga', '2ª Jornada', NULL, 'estrelas-vermelhas', 'serzedo', NULL, NULL, '2026-10-17', 'scheduled', NULL, NULL),
    ('super-liga', '2ª Jornada', NULL, 'pinheiro', 'sao-faustino', NULL, NULL, '2026-10-17', 'scheduled', NULL, NULL),
    ('super-liga', '3ª Jornada', NULL, 'polvoreira', 'atletico-costa', NULL, NULL, '2026-10-24', 'scheduled', NULL, NULL),
    ('super-liga', '3ª Jornada', NULL, 'serzedo', 'calvos', NULL, NULL, '2026-10-24', 'scheduled', NULL, NULL),
    ('super-liga', '3ª Jornada', NULL, 'ataes', 'pinheiro', NULL, NULL, '2026-10-24', 'scheduled', NULL, NULL),
    ('super-liga', '3ª Jornada', NULL, 'sao-faustino', 'estrelas-vermelhas', NULL, NULL, '2026-10-24', 'scheduled', NULL, NULL),
    ('super-liga', '4ª Jornada', NULL, 'serzedo', 'polvoreira', NULL, NULL, '2026-11-07', 'scheduled', NULL, NULL),
    ('super-liga', '4ª Jornada', NULL, 'pinheiro', 'atletico-costa', NULL, NULL, '2026-11-07', 'scheduled', NULL, NULL),
    ('super-liga', '4ª Jornada', NULL, 'calvos', 'sao-faustino', NULL, NULL, '2026-11-07', 'scheduled', NULL, NULL),
    ('super-liga', '4ª Jornada', NULL, 'estrelas-vermelhas', 'ataes', NULL, NULL, '2026-11-07', 'scheduled', NULL, NULL),
    ('super-liga', '5ª Jornada', NULL, 'polvoreira', 'pinheiro', NULL, NULL, '2026-11-28', 'scheduled', NULL, NULL),
    ('super-liga', '5ª Jornada', NULL, 'sao-faustino', 'serzedo', NULL, NULL, '2026-11-28', 'scheduled', NULL, NULL),
    ('super-liga', '5ª Jornada', NULL, 'atletico-costa', 'estrelas-vermelhas', NULL, NULL, '2026-11-28', 'scheduled', NULL, NULL),
    ('super-liga', '5ª Jornada', NULL, 'ataes', 'calvos', NULL, NULL, '2026-11-28', 'scheduled', NULL, NULL),
    ('super-liga', '6ª Jornada', NULL, 'sao-faustino', 'polvoreira', NULL, NULL, '2026-12-12', 'scheduled', NULL, NULL),
    ('super-liga', '6ª Jornada', NULL, 'estrelas-vermelhas', 'pinheiro', NULL, NULL, '2026-12-12', 'scheduled', NULL, NULL),
    ('super-liga', '6ª Jornada', NULL, 'serzedo', 'ataes', NULL, NULL, '2026-12-12', 'scheduled', NULL, NULL),
    ('super-liga', '6ª Jornada', NULL, 'calvos', 'atletico-costa', NULL, NULL, '2026-12-12', 'scheduled', NULL, NULL),
    ('super-liga', '7ª Jornada', NULL, 'polvoreira', 'estrelas-vermelhas', NULL, NULL, '2027-01-06', 'scheduled', NULL, NULL),
    ('super-liga', '7ª Jornada', NULL, 'ataes', 'sao-faustino', NULL, NULL, '2027-01-06', 'scheduled', NULL, NULL),
    ('super-liga', '7ª Jornada', NULL, 'pinheiro', 'calvos', NULL, NULL, '2027-01-06', 'scheduled', NULL, NULL),
    ('super-liga', '7ª Jornada', NULL, 'atletico-costa', 'serzedo', NULL, NULL, '2027-01-06', 'scheduled', NULL, NULL),
    ('super-liga', '8ª Jornada', NULL, 'ataes', 'polvoreira', NULL, NULL, '2027-01-30', 'scheduled', NULL, NULL),
    ('super-liga', '8ª Jornada', NULL, 'estrelas-vermelhas', 'calvos', NULL, NULL, '2027-01-30', 'scheduled', NULL, NULL),
    ('super-liga', '8ª Jornada', NULL, 'atletico-costa', 'sao-faustino', NULL, NULL, '2027-01-30', 'scheduled', NULL, NULL),
    ('super-liga', '8ª Jornada', NULL, 'pinheiro', 'serzedo', NULL, NULL, '2027-01-30', 'scheduled', NULL, NULL),
    ('super-liga', '9ª Jornada', NULL, 'polvoreira', 'calvos', NULL, NULL, '2027-02-20', 'scheduled', NULL, NULL),
    ('super-liga', '9ª Jornada', NULL, 'ataes', 'atletico-costa', NULL, NULL, '2027-02-20', 'scheduled', NULL, NULL),
    ('super-liga', '9ª Jornada', NULL, 'serzedo', 'estrelas-vermelhas', NULL, NULL, '2027-02-20', 'scheduled', NULL, NULL),
    ('super-liga', '9ª Jornada', NULL, 'sao-faustino', 'pinheiro', NULL, NULL, '2027-02-20', 'scheduled', NULL, NULL),
    ('super-liga', '10ª Jornada', NULL, 'atletico-costa', 'polvoreira', NULL, NULL, '2027-03-13', 'scheduled', NULL, NULL),
    ('super-liga', '10ª Jornada', NULL, 'calvos', 'serzedo', NULL, NULL, '2027-03-13', 'scheduled', NULL, NULL),
    ('super-liga', '10ª Jornada', NULL, 'pinheiro', 'ataes', NULL, NULL, '2027-03-13', 'scheduled', NULL, NULL),
    ('super-liga', '10ª Jornada', NULL, 'estrelas-vermelhas', 'sao-faustino', NULL, NULL, '2027-03-13', 'scheduled', NULL, NULL),
    ('super-liga', '11ª Jornada', NULL, 'polvoreira', 'serzedo', NULL, NULL, '2027-04-03', 'scheduled', NULL, NULL),
    ('super-liga', '11ª Jornada', NULL, 'atletico-costa', 'pinheiro', NULL, NULL, '2027-04-03', 'scheduled', NULL, NULL),
    ('super-liga', '11ª Jornada', NULL, 'sao-faustino', 'calvos', NULL, NULL, '2027-04-03', 'scheduled', NULL, NULL),
    ('super-liga', '11ª Jornada', NULL, 'ataes', 'estrelas-vermelhas', NULL, NULL, '2027-04-03', 'scheduled', NULL, NULL),
    ('super-liga', '12ª Jornada', NULL, 'pinheiro', 'polvoreira', NULL, NULL, '2027-04-17', 'scheduled', NULL, NULL),
    ('super-liga', '12ª Jornada', NULL, 'serzedo', 'sao-faustino', NULL, NULL, '2027-04-17', 'scheduled', NULL, NULL),
    ('super-liga', '12ª Jornada', NULL, 'estrelas-vermelhas', 'atletico-costa', NULL, NULL, '2027-04-17', 'scheduled', NULL, NULL),
    ('super-liga', '12ª Jornada', NULL, 'calvos', 'ataes', NULL, NULL, '2027-04-17', 'scheduled', NULL, NULL),
    ('super-liga', '13ª Jornada', NULL, 'polvoreira', 'sao-faustino', NULL, NULL, '2027-05-06', 'scheduled', NULL, NULL),
    ('super-liga', '13ª Jornada', NULL, 'pinheiro', 'estrelas-vermelhas', NULL, NULL, '2027-05-06', 'scheduled', NULL, NULL),
    ('super-liga', '13ª Jornada', NULL, 'ataes', 'serzedo', NULL, NULL, '2027-05-06', 'scheduled', NULL, NULL),
    ('super-liga', '13ª Jornada', NULL, 'atletico-costa', 'calvos', NULL, NULL, '2027-05-06', 'scheduled', NULL, NULL),
    ('super-liga', '14ª Jornada', NULL, 'estrelas-vermelhas', 'polvoreira', NULL, NULL, '2027-05-15', 'scheduled', NULL, NULL),
    ('super-liga', '14ª Jornada', NULL, 'sao-faustino', 'ataes', NULL, NULL, '2027-05-15', 'scheduled', NULL, NULL),
    ('super-liga', '14ª Jornada', NULL, 'calvos', 'pinheiro', NULL, NULL, '2027-05-15', 'scheduled', NULL, NULL),
    ('super-liga', '14ª Jornada', NULL, 'serzedo', 'atletico-costa', NULL, NULL, '2027-05-15', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Quartos de Final — 1ª Mão', 'Jogo 1', 'ataes', 'pinheiro', NULL, NULL, '2026-10-31', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Quartos de Final — 1ª Mão', 'Jogo 2', 'atletico-costa', 'polvoreira', NULL, NULL, '2026-10-31', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Quartos de Final — 1ª Mão', 'Jogo 3', 'estrelas-vermelhas', 'calvos', NULL, NULL, '2026-10-31', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Quartos de Final — 1ª Mão', 'Jogo 4', 'sao-faustino', 'serzedo', NULL, NULL, '2026-10-31', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Quartos de Final — 2ª Mão', 'Jogo 1', 'pinheiro', 'ataes', NULL, NULL, '2026-12-19', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Quartos de Final — 2ª Mão', 'Jogo 2', 'polvoreira', 'atletico-costa', NULL, NULL, '2026-12-19', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Quartos de Final — 2ª Mão', 'Jogo 3', 'calvos', 'estrelas-vermelhas', NULL, NULL, '2026-12-19', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Quartos de Final — 2ª Mão', 'Jogo 4', 'serzedo', 'sao-faustino', NULL, NULL, '2026-12-19', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Quartos de Final — 1ª Mão', 'Jogo 1', 'ataes', 'atletico-costa', NULL, NULL, '2026-11-21', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Quartos de Final — 1ª Mão', 'Jogo 2', 'estrelas-vermelhas', 'serzedo', NULL, NULL, '2026-11-21', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Quartos de Final — 1ª Mão', 'Jogo 3', 'polvoreira', 'sao-faustino', NULL, NULL, '2026-11-21', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Quartos de Final — 1ª Mão', 'Jogo 4', 'pinheiro', 'calvos', NULL, NULL, '2026-11-21', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Quartos de Final — 2ª Mão', 'Jogo 1', 'atletico-costa', 'ataes', NULL, NULL, '2027-01-23', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Quartos de Final — 2ª Mão', 'Jogo 2', 'serzedo', 'estrelas-vermelhas', NULL, NULL, '2027-01-23', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Quartos de Final — 2ª Mão', 'Jogo 3', 'sao-faustino', 'polvoreira', NULL, NULL, '2027-01-23', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Quartos de Final — 2ª Mão', 'Jogo 4', 'calvos', 'pinheiro', NULL, NULL, '2027-01-23', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Meias-Finais — 1ª Mão', 'Jogo 5', NULL, NULL, 'Vencedor jogo 4', 'Vencedor jogo 1', '2027-02-13', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Meias-Finais — 1ª Mão', 'Jogo 6', NULL, NULL, 'Vencedor jogo 3', 'Vencedor jogo 2', '2027-02-13', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Meias-Finais — 2ª Mão', 'Jogo 5', NULL, NULL, 'Vencedor jogo 1', 'Vencedor jogo 4', '2027-03-27', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Meias-Finais — 2ª Mão', 'Jogo 6', NULL, NULL, 'Vencedor jogo 2', 'Vencedor jogo 3', '2027-03-27', 'scheduled', NULL, NULL),
    ('taca-associacao', 'Final', 'Jogo 7', NULL, NULL, 'Vencedor jogo 5', 'Vencedor jogo 6', '2027-05-29', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Meias-Finais — 1ª Mão', 'Jogo 5', NULL, NULL, 'Vencedor jogo 4', 'Vencedor jogo 3', '2027-02-27', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Meias-Finais — 1ª Mão', 'Jogo 6', NULL, NULL, 'Vencedor jogo 2', 'Vencedor jogo 1', '2027-02-27', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Meias-Finais — 2ª Mão', 'Jogo 5', NULL, NULL, 'Vencedor jogo 3', 'Vencedor jogo 4', '2027-04-24', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Meias-Finais — 2ª Mão', 'Jogo 6', NULL, NULL, 'Vencedor jogo 1', 'Vencedor jogo 2', '2027-04-24', 'scheduled', NULL, NULL),
    ('taca-cidade-berco', 'Final', 'Jogo 7', NULL, NULL, 'Vencedor jogo 5', 'Vencedor jogo 6', '2027-06-05', 'scheduled', NULL, NULL)
  ) v
  JOIN seasons s ON s.name = '2026/2027'
  JOIN competitions co ON co.slug = v.column1
  LEFT JOIN clubs hc ON hc.slug = v.column4
  LEFT JOIN clubs ac ON ac.slug = v.column5
 WHERE NOT EXISTS (SELECT 1 FROM games);
