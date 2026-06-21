# Shellnotes Mentor

Serviço privado executado no droplet. Ele aceita somente requisições assinadas pela
rota server-side da Vercel e chama `claude -p` usando a assinatura Claude configurada
em `CLAUDE_CODE_OAUTH_TOKEN`.

## Variáveis do droplet

Arquivo `/etc/shellnotes-mentor.env`, propriedade `root:root` e modo `600`:

```dotenv
SHELLNOTES_MENTOR_SECRET=...
MENTOR_PORT=3100
CLAUDE_MODEL=sonnet
```

O segredo deve ter pelo menos 32 caracteres e ser igual ao configurado na Vercel.
O serviço roda como `deploy` e reutiliza o login OAuth já salvo em
`/home/deploy/.claude/`. `CLAUDE_CODE_OAUTH_TOKEN` é opcional e não deve ser
configurado quando o login normal já funciona.

## Variáveis da Vercel

```dotenv
SHELLNOTES_MENTOR_URL=https://mentor.shellnotes.tech
SHELLNOTES_MENTOR_SECRET=...
```

Nenhuma dessas variáveis deve começar com `NEXT_PUBLIC_`.

## Segurança

- O processo escuta somente em `127.0.0.1`.
- O Caddy expõe apenas `/health` e `/v1/ask`.
- Toda pergunta é autenticada com HMAC SHA-256, timestamp e ID antirreplay.
- O Claude executa sem ferramentas e sem persistência de sessão.
- Há apenas uma execução por vez, fila curta e cache de quinze minutos.
