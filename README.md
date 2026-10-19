# Sábado à Tarde

**O futebol popular de Guimarães num só sítio.** Resultados, classificações, competições, clubes e notícias da Associação de Futebol Popular de Guimarães (AFPG), num site moderno, rápido e pensado para o telemóvel.

É um projeto independente, feito por e para os adeptos. Em breve em **sabadoatarde.pt**.

## O que tem

- **Jogos e resultados**, incluindo jogos ao vivo, com golos e cartões.
- **Classificações** atualizadas automaticamente a cada resultado.
- **Competições**: a Super Liga e as taças da AFPG, cada uma com a sua página.
- **Clubes**, com símbolo, cores, plantel e jogos de cada equipa.
- **Notícias, transferências e documentos** (regulamentos, calendários, comunicados).
- **Contas de utilizador**, criadas com email ou com Google.
- **Área de gestão** com três perfis: utilizador, gestor de jogos (lança resultados) e administrador.

## Stack

| | |
|---|---|
| **Site** | React com TanStack Start, com as páginas geradas no servidor para carregarem depressa e aparecerem bem nas pesquisas e nas partilhas |
| **Design** | Tailwind CSS e componentes shadcn/ui |
| **API** | TypeScript com Hono |
| **Base de dados** | Cloudflare D1 |
| **Imagens** | Cloudflare R2 |
| **Alojamento** | Cloudflare Workers |
| **Login** | Email e palavra-passe, ou Google |
| **Qualidade** | Testes automáticos e verificações em cada pull request, com GitHub Actions |

Tudo corre na Cloudflare: o site e a API estão separados, e só o site está exposto à internet.

## Contribuir

Todos são bem-vindos a contribuir! Correções, ideias, melhorias de design ou de conteúdo: tudo ajuda.

1. Faz um fork do repositório e cria um branch a partir de `main`.
2. Segue o [DEVELOPMENT.md](DEVELOPMENT.md) para correr o projeto localmente.
3. Abre um pull request para `main` a explicar o que mudou e porquê.

Todos os pull requests são revistos e aprovados pelo maintainer antes de entrarem em `main`. Para ideias maiores, abre primeiro uma issue para falarmos sobre elas.

## Licença

[MIT](LICENSE): podes usar, alterar e distribuir o código livremente, desde que mantenhas o aviso de copyright. Ao contribuíres, aceitas que a tua contribuição fica sob a mesma licença.
