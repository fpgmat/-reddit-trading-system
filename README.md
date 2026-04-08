# 🚀 Reddit Trading Analytics

Sistema automatizado de coleta e análise de discussões do Reddit sobre trading.

## 📋 Funcionalidades

- Coleta de posts dos subreddits de trading
- Classificação automática (tipo, mercado, nível)
- Identificação de dores, perguntas, tendências e oportunidades
- Dashboard interativo
- Skill para Claude Code

## 🚀 Instalação

```bash
npm install
```

## 🏃‍♂️ Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

Acesse: http://localhost:3000

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `APIFY_API_TOKEN` | Token da API Apify | (obrigatório) |
| `PORT` | Porta do servidor | 3000 |

## 📊 Subreddits Monitorados

### Geral
- r/Daytrading
- r/swingtrading
- r/stocks
- r/options
- r/algotrading

### Brasil
- r/investimentos
- r/BrazilStocks
- r/farialimabets

### Automação
- r/TradingView
- r/Python

## 🧠 Skill

Use `/skill-creator reddit-analyst` no Claude Code para ativar a skill de análise.

## 📁 Estrutura

```
reddit-trading-system/
├── src/
│   ├── server.js          # Servidor Express
│   ├── apify-scraper.js   # Integração Apify
│   ├── analyzer.js        # Motor de análise
│   └── classification.js  # Classificação automática
├── dashboard/
│   ├── index.html         # Dashboard principal
│   └── styles.css         # Estilos dark theme
├── skills/
│   └── reddit-analyst.md  # Skill Claude Code
├── data/                  # Dados coletados (JSON)
├── package.json
└── README.md
```

## 📈 Output

O sistema gera JSON estruturado com:

```json
{
  "dores": [...],
  "perguntas": [...],
  "tendencias": [...],
  "oportunidades": [...],
  "stats": {
    "totalPosts": 120,
    "subreddits": 8,
    "period": "month"
  }
}
```

## ⚠️ Filtros

- Ignora memes e shitposts
- Prioriza posts com alto engajamento
- Detecta padrões repetidos
