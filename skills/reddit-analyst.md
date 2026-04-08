---
name: reddit-analyst
description: Skill para análise de trading do Reddit - coleta e geração de insights
type: skill
---

# 🔍 Reddit Trading Analyst

Skill especializada em análise de discussões do Reddit sobre trading.

## 📋 Funcionalidades

- Coleta automática via Apify
- Classificação de posts (tipo, mercado, nível)
- Identificação de dores e problemas
- Detecção de perguntas sem resposta
- Descoberta de tendências
- Geração de oportunidades de conteúdo

## 🎯 Como usar

1. Execute o scraping: `POST /api/scrape`
2. Obtenha resultados: `GET /api/latest`
3. Analise insights no dashboard: `http://localhost:3000`

## 📊 Estrutura de output

```json
{
  "dores": [
    {
      "descricao": "Stop atingido com frequência",
      "frequencia": "alta",
      "impacto": "alto",
      "exemplo": "Perdi 10 trades seguidos no stop..."
    }
  ],
  "perguntas": [...],
  "tendencias": [...],
  "oportunidades": [...]
}
```

## 🧠 Contexto

- Subreddits: Daytrading, Swingtrading, Stocks, Options, Algotrading, Investimentos, BrazilStocks, FariaLimeBets, TradingView, Python
- Foco: conteúdo acionável, padrões recorrentes, validar ideias de produtos
