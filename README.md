# ninaz-site

Site da Operação Leve — carta de vendas única, link bio.

## Stack
HTML/CSS estático. Sem build step. Deploy direto na Vercel.

## Estrutura
```
.
├── index.html          # Carta de vendas
├── styles.css          # Estilo (Fraunces + Inter, paleta cream/green)
├── assets/
│   └── favicon.svg     # Favicon
└── README.md
```

## Editar a copy
A copy mestre vive no Obsidian em `Ninaz/Carta de Vendas.md`.

Para atualizar o site:
1. Edite o texto direto no `index.html`
2. `git add . && git commit -m "copy: ..."`
3. `git push` — Vercel re-deploya automaticamente

## Antes do go-live
Substituir `SEU_NUMERO` no `index.html` pelo número real do WhatsApp Business no formato internacional (ex: `5511999999999`). Há duas ocorrências:
- Botão CTA principal
- Botão flutuante (`.whatsapp-float`)

## Rodar localmente
```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

Ou apenas abrir `index.html` direto no navegador.

## Deploy
```bash
vercel --prod
```
