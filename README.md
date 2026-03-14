# Edinburgh Geburtstagsreise

Statische, mobile-first Microsite mit zwei getrennten Gutschein-Versionen:

- Teaser für Axel: `/v/c7n2f9m4e8q1/`
- Vollversion für Sabine: `/v/j8r5k1t9w2p6/`

Version: `1.0.1`

## Vorschau lokal

```bash
npm run preview
```

Danach im Browser öffnen:

- `http://localhost:4173/v/c7n2f9m4e8q1/`
- `http://localhost:4173/v/j8r5k1t9w2p6/`

## Struktur

```text
.
├── README.md
├── assets
│   ├── scripts
│   │   └── bagpipe-audio.js
│   └── styles
│       └── main.css
├── .github
│   └── workflows
│       └── deploy-pages.yml
├── index.html
├── package.json
└── v
    ├── c7n2f9m4e8q1
    │   └── index.html
    └── j8r5k1t9w2p6
        └── index.html
```
