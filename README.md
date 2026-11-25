# HR da Amazônia — monorepo

Site institucional e Portal do Colaborador. Fonte: Barlow (Google Fonts).

```text
apps/web         Next.js 16 (site + telas do portal). Não acessa o banco.
apps/api         NestJS 12 + Prisma 7. Login, usuários, auditoria e formulários.
packages/shared  Tipos e regras usados pelos dois (campos dos formulários, setores, etc.).
PostgreSQL 17    Banco de dados, em container.
```

O navegador só fala com o site. O site chama a API pelo servidor, com uma chave interna (`INTERNAL_API_KEY`).
No Docker, a API e o banco não ficam expostos para fora.

## Primeira vez

Requisitos: Node 24 e Docker Desktop.

```bash
npm install
npm run setup         # cria o .env com senhas e chaves aleatórias
npm run db:up         # sobe só o PostgreSQL (porta 5434, apenas nesta máquina)
npm run db:migrate    # cria as tabelas
npm run criar-admin -- "Nome Completo" email@hr.log.br
```

A senha provisória aparece no terminal. Para recuperar o acesso de um administrador, acrescente `--redefinir`.

## Desenvolvimento

```bash
npm run dev           # site em http://localhost:3000 e API em http://localhost:3333
```

Sem SMTP no `.env`, os formulários ficam em `apps/api/.submissions/` e o link de recuperação de senha aparece no terminal.

## Tudo no Docker

```bash
npm run docker:up     # banco, migrações, API e site; site em http://localhost:3000
npm run docker:logs
npm run docker:down   # para os containers (os dados continuam no volume)
docker compose exec api node dist/cli/create-admin.js "Nome Completo" email@hr.log.br
```

A primeira montagem das imagens pode levar bastante tempo (a instalação de pacotes dentro do Docker é lenta nesta máquina).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run build` / `npm start` | versão de produção sem Docker |
| `npm run typecheck` | confere os tipos dos três pacotes |
| `npm run migrate:new -- --name descricao` | cria uma migração após editar `apps/api/prisma/schema.prisma` |

## Perfis e conteúdo do site

| Perfil | O que faz no portal |
| --- | --- |
| Colaborador | atalhos, perfil e senha |
| Operação | tudo do colaborador, mais **Cargas** (não vê o conteúdo do site) |
| Marketing | tudo do colaborador, mais **Notícias**, **Imagens**, **Partes do site** e **Contatos e redes** |
| Administrador | tudo do Marketing e da Operação, mais **Usuários** e **Atividades** |

O administrador cria a conta do Marketing em **Usuários → Novo funcionário**, escolhendo o perfil **Marketing**.

1. **Imagens:** enviar a foto (JPG, PNG ou WEBP, até 8 MB). Uma imagem em uso numa área do site não pode ser apagada.
2. **Notícias:** salvar como rascunho, pré-visualizar e publicar no HR NEWS.
3. **Partes do site:** adicionar, editar, ocultar, reordenar e remover:

| Área | Onde aparece | Limite visível |
| --- | --- | --- |
| Fotos do topo | topo da página inicial | de 1 a 6 |
| Depoimentos | página inicial | 12 |
| Logos de clientes | página inicial | 40 |
| Galerias | Nossa Frota, HR Armazéns Gerais e Quem Somos | 30 cada |

4. **Contatos e redes:** frase de boas-vindas, e-mail, endereço, link do rastreamento, telefones, WhatsApp, redes sociais
   (Facebook, Instagram, LinkedIn, YouTube e TikTok) e as unidades do Onde Estamos. Links precisam começar com `https://`.
   Os e-mails que **recebem** os formulários continuam no `.env` (`MAIL_TO_CONTATO` e `MAIL_TO_COTACAO`).

As mudanças aparecem no site na hora. Área sem item visível some da página. Se a API cair, o site mostra o conteúdo padrão.
As demais fotos das páginas (capas e blocos de texto) são fixas.

## Acompanhamento de cargas

1. **No portal (Operação ou Administrador), em Cargas → Nova carga:** cliente, CNPJ/CPF, origem, destino e transporte.
   O sistema gera um código como `HR-XXXX-XXXX`. O botão **Copiar mensagem para o cliente** monta o texto com o link.
2. **Registrar andamento:** etapa, local, data (em branco = agora, horário de Manaus) e observação.
   **O cliente vê a observação.** A etapa atual é a do lançamento com a data mais recente.
3. **No site, em `/rastreamento`:** o cliente informa o código e o CNPJ/CPF do cadastro.

A resposta pública não traz o nome do cliente nem dados da equipe. Após 20 consultas sem sucesso do mesmo IP em 15 min,
as consultas desse IP são bloqueadas. O CNPJ/CPF não aparece no endereço da página.

As cargas **não** vêm do sistema antigo (AMS): precisam ser cadastradas aqui. A página mantém um link para o AMS,
configurável em **Contatos e redes**.

## API

Todas as rotas exigem a chave interna e, exceto as marcadas, uma sessão (`Authorization: Bearer`).

| Rota | Acesso |
| --- | --- |
| `GET /health` | livre (usado pelo Docker) |
| `POST /auth/login`, `/auth/password/forgot`, `/auth/password/reset` | sem sessão |
| `GET /captcha`, `POST /forms/contato`, `POST /forms/cotacao` | sem sessão |
| `GET /auth/session`, `POST /auth/logout`, `POST /auth/password/change` | sessão (até com senha provisória) |
| `GET/DELETE /auth/sessions`, `GET /dashboard` | sessão |
| `/users…`, `GET /audit` | administrador |
| `/cargo…` | Operação e administrador |
| `POST /public/tracking` | sem sessão (código + CNPJ/CPF, com limite de tentativas) |
| `/content/media…`, `/content/posts…`, `/content/site…`, `/content/settings` | Marketing e administrador |
| `GET /public/posts`, `/public/site`, `/public/settings`, `/public/media/:id` | sem sessão (só o que está publicado ou visível) |

Rotas novas exigem login por padrão. Para liberar, use `@Public()`; para restringir, `@AdminOnly()`.

## Segurança

- Senhas com scrypt; mínimo de 10 caracteres. Senha provisória vale 72 h e é trocada no primeiro acesso.
- O banco guarda só o hash do token de sessão. Cookie `httpOnly`, `SameSite=Lax`.
  Sem "manter conectado": 2 h sem uso ou 12 h no total. Com a opção: 30 dias.
- Bloqueio de 15 min após 5 erros do mesmo e-mail e IP (30 somando IPs). Limites e captchas ficam no banco.
- Trocar a senha desconecta os outros aparelhos. Redefinir a senha ou desativar a conta desconecta todos.
- As ações de administrador rodam uma de cada vez e ninguém altera a própria conta, então sempre sobra um administrador.
- Não há verificação em duas etapas.

## Dependência forçada

O `package.json` da raiz usa `overrides` para instalar `effect` 3.22.5. O Prisma 7.10.1 pede a 3.20.0, que tem uma
[falha conhecida](https://github.com/advisories/GHSA-7589-6fvf-x4pw). O `npm ls effect` mostra essa versão como `invalid`: é esperado.
Quando atualizar o Prisma, remova o `overrides` se o `npm audit` continuar limpo sem ele.

Se o `npm` apagar a biblioteca ao mexer no `overrides`, confira com `npm run db:migrate`: o `npm audit` sozinho
mostra "0 vulnerabilities" mesmo com ela ausente.

## Publicar

- Use **HTTPS** na frente do site; em produção o cookie só trafega em conexão segura.
- Preencha `APP_URL` e o SMTP no `.env`.
- Faça backup do volume `hr-logistica_pgdata` (as imagens enviadas ficam dentro do banco).
- Os anexos são checados por extensão, sem antivírus.
- O limite por IP usa `x-forwarded-for`; publique atrás de um proxy que o sobrescreva.

## Onde editar

| O quê | Arquivo |
| --- | --- |
| Notícias, fotos do topo, depoimentos, clientes, galerias | no portal (Marketing) |
| Contatos, WhatsApp, redes sociais, unidades | no portal (Marketing) |
| Textos, menu, serviços, notícias antigas | `apps/web/src/lib/content.ts` |
| Regras de cada área editável | `siteSections` em `packages/shared/src/auth.ts` |
| Campos dos formulários, setores | `packages/shared/src/` |
| Cores e fontes | `apps/web/src/app/globals.css` |
| Animações reutilizáveis | `apps/web/src/components/motion.tsx` |
| Fotos e logos | `apps/web/public/` |
| Tabelas do banco | `apps/api/prisma/schema.prisma` |

## Confirmar com a empresa antes de publicar

Contatos, redes e unidades podem ser corrigidos no portal, em **Contatos e redes**.

- **E-mail:** o site antigo mostra `contato@hrl.og.br` (provável erro). Foi usado `comercial@hr.log.br`.
- **Endereço de Manaus:** o rodapé diz "Avenida Puraquequara, 777"; Onde Estamos diz "Estrada do Puraquequara, 777 – Distrito Industrial II".
- **Armazéns:** uma página cita cerca de 10.000 m² com "dezenas de docas"; outra, 7.000 m² com 6 docas.
- **Visão:** o texto ainda diz "até 2025".
- **Frases novas:** títulos de efeito, resumos dos serviços e etapas da cotação foram criados para o novo layout.
- **Mapa:** é um esquema por coordenadas aproximadas, não um mapa geográfico.
- **Logo da Eficácia:** não pôde ser baixado.
