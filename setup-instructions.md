# 📦 PASSO A PASSO - INSTALAÇÃO RÁPIDA

## 1️⃣ Criar Pasta

```bash
mkdir reddit-trading-system
cd reddit-trading-system
```

## 2️⃣ Criar Arquivos

Use qualquer editor de texto (VS Code, Notepad++, etc.) e crie as pastas:

```
reddit-trading-system/
├── src/
├── dashboard/
├── skills/
├── data/
```

## 3️⃣ Arquivos a Copiar/Colar

### `package.json`
```json
{
  "name": "reddit-trading-analytics",
  "version": "1.0.0",
  "description": "Sistema de análise do Reddit para trading",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "node-fetch": "^3.3.2"
  }
}
```

### `src/server.js`
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scrapeReddit } from './apify-scraper.js';
import { analyzePosts } from './analyzer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('../dashboard'));

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', uptime: process.uptime() });
});

app.post('/api/scrape', async (req, res) => {
  try {
    const posts = await scrapeReddit();
    const analysis = await analyzePosts(posts);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/latest', async (req, res) => {
  try {
    const fs = await import('fs');
    const files = fs.readdirSync('data').filter(f => f.startsWith('analysis_'));
    if (files.length === 0) return res.json({ exists: false });
    const latest = files.sort().pop();
    const data = JSON.parse(fs.readFileSync(`data/${latest}`, 'utf8'));
    res.json({ exists: true, data });
  } catch {
    res.json({ exists: false });
  }
});

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '../dashboard' });
});

app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
});
```

### `src/apify-scraper.js`
```javascript
const SUBREDDITS = {
  geral: ['Daytrading', 'swingtrading', 'stocks', 'options', 'algotrading'],
  brasil: ['investimentos', 'BrazilStocks', 'farialimabets'],
  automacao: ['TradingView', 'Python']
};

const CONFIG = { sort: ['top', 'new'], time: 'month', maxPosts: 500, minUpvotes: 5, minComments: 3 };

async function scrapeReddit() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_API_TOKEN não configurado');

  const allPosts = [];
  for (const category of Object.keys(SUBREDDITS)) {
    for (const subreddit of SUBREDDITS[category]) {
      try {
        const posts = await callApify(token, subreddit, CONFIG);
        allPosts.push(...posts.map(p => ({ ...p, category, subreddit: `r/${subreddit}` })));
      } catch (e) { console.error(`Erro r/${subreddit}:`, e.message); }
    }
  }
  return allPosts;
}

async function callApify(token, subreddit, config) {
  const url = 'https://api.apify.com/v2/acts/apify~reddit-scraper/run-sync-get-dataset-items';
  const params = new URLSearchParams({ token, format: 'json' });

  const response = await fetch(`${url}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url: `https://www.reddit.com/r/${subreddit}/` }],
      sort: config.sort,
      time: config.time,
      maxPosts: config.maxPosts,
      minUpvotes: config.minUpvotes,
      minComments: config.minComments
    })
  });

  if (!response.ok) throw new Error('Erro Apify');
  const data = await response.json();
  return data || [];
}

export { scrapeReddit };
```

### `src/classification.js`
```javascript
const KEYWORDS = {
  swing: ['swing', 'position', 'medium term'],
  day: ['day trade', 'intraday', 'scalping'],
  options: ['option', 'call', 'put', 'strike', 'theta'],
  automacao: ['python', 'bot', 'automation', 'script', 'backtest'],
  long_short: ['long', 'short', 'hedge']
};

const MARKET_KEYWORDS = {
  b3: ['b3', 'petr4', 'vale3', 'itub4'],
  eua: ['nasdaq', 'sp500', 'spy', 'nvda', 'aapl', 'tsla'],
  global: ['forex', 'crypto', 'bitcoin', 'ethereum']
};

const LEVEL_KEYWORDS = {
  iniciante: ['beginner', 'starting', 'iniciar', 'aprender'],
  intermediario: ['improving', 'estrategia', 'melhorar'],
  avancado: ['advanced', 'quant', 'professional']
};

function classifyType(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  for (const [type, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => text.includes(w))) {
      return type === 'long_short' ? 'Long & Short' : type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }
  return 'Geral';
}

function classifyMarket(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  for (const [market, words] of Object.entries(MARKET_KEYWORDS)) {
    if (words.some(w => text.includes(w))) return market.toUpperCase();
  }
  return 'Global';
}

function classifyLevel(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();
  for (const [level, words] of Object.entries(LEVEL_KEYWORDS)) {
    if (words.some(w => text.includes(w))) return level.charAt(0).toUpperCase() + level.slice(1);
  }
  return 'Intermediário';
}

export function classifyPost(post) {
  return {
    ...post,
    tipo: classifyType(post.title, post.content || ''),
    mercado: classifyMarket(post.title, post.content || ''),
    nivel: classifyLevel(post.title, post.content || '')
  };
}
```

### `src/analyzer.js`
```javascript
function isComplaint(text) {
  const markers = ['lost', 'perdi', 'perda', 'stopado', 'bambu', 'fomo', 'errei', 'quebrado'];
  text = text.toLowerCase();
  return markers.some(m => text.includes(m));
}

function isQuestion(text) {
  const markers = ['?', 'como', 'why', 'what', 'help', 'dúvida', 'alguém'];
  text = text.toLowerCase();
  return markers.some(m => text.includes(m));
}

function extractKeywords(posts) {
  const freqs = new Map();
  for (const post of posts) {
    const words = (post.title + ' ' + (post.content || '')).toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    for (const w of words) freqs.set(w, (freqs.get(w) || 0) + 1);
  }
  return Array.from(freqs.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([word, count]) => ({ word, count }));
}

function detectTrends(posts) {
  const themes = new Map();
  const themeTriggers = {
    quant: ['quant', 'backtest', 'strategy'],
    ia: ['ai', 'machine', 'neural', 'gpt'],
    crypto: ['bitcoin', 'crypto', 'ethereum'],
    bruto: ['bruto', 'dividendos', 'fii'],
    swing: ['swing', 'position', 'hold'],
    ta: ['ta', 'technical', 'chart', 'gráfico']
  };

  for (const post of posts) {
    const text = (post.title + ' ' + (post.content || '')).toLowerCase();
    for (const [theme, triggers] of Object.entries(themeTriggers)) {
      if (triggers.some(t => text.includes(t))) themes.set(theme, (themes.get(theme) || 0) + 1);
    }
  }

  return Array.from(themes.entries()).filter(([_, c]) => c >= 3).map(([theme, count]) => ({
    tema: theme, mencoes: count, tendencia: count >= 10 ? 'forte' : count >= 5 ? 'media' : 'fraca'
  }));
}

function detectIssues(post) {
  const text = (post.title + ' ' + (post.content || '')).toLowerCase();
  const issues = [];
  const issueMap = {
    'stop atingido': ['stopado', 'stop loss', 'bambu'],
    'FOMO': ['fomo', 'medo de perder'],
    'falta de disciplina': ['disciplina', 'emocional'],
    'gestão de risco': ['position size', 'risk', 'gestão']
  };

  for (const [issue, markers] of Object.entries(issueMap)) {
    if (markers.some(m => text.includes(m))) issues.push(issue);
  }
  return issues;
}

export async function analyzePosts(posts) {
  const classified = posts.map(p => classifyPost(p));
  const complaints = classified.filter(isComplaint);
  const questions = classified.filter(isQuestion);

  // Dores
  const dores = [];
  for (const post of complaints) {
    const issues = detectIssues(post);
    for (const issue of issues) {
      const existing = dores.find(d => d.descricao === issue);
      if (existing) {
        existing.frequencia++;
        existing.exemplos.push(post.title);
      } else {
        dores.push({ descricao: issue, frequencia: 1, impacto: 'medio', exemplos: [post.title] });
      }
    }
  }

  return {
    dores: dores.sort((a, b) => b.frequencia - a.frequencia).slice(0, 15).map(d => ({
      descricao: d.descricao,
      frequencia: d.frequencia > 5 ? 'alta' : d.frequencia > 2 ? 'media' : 'baixa',
      impacto: d.impacto,
      exemplo: d.exemplos[0] || ''
    })),
    perguntas: questions
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      .slice(0, 20)
      .map(p => ({
        pergunta: p.title,
        engajamento: p.upvotes || 0,
        comentarios: p.num_comments || 0
      })),
    tendencias: detectTrends(classified),
    oportunidades: extractKeywords(classified)
      .filter(k => k.count >= 2 && k.count <= 5)
      .slice(0, 10)
      .map(k => ({ ideia: k.word, tipo: k.count > 3 ? 'video' : 'curso', justificativa: `${k.count} menções` })),
    keywords: extractKeywords(classified),
    stats: {
      totalPosts: posts.length,
      subreddits: new Set(classified.map(p => p.subreddit)).size
    }
  };
}
```

### `dashboard/index.html`
Copie o arquivo completo enviado anteriormente.

### `dashboard/styles.css`
Copie o arquivo completo enviado anteriormente.

### `dashboard/app.js`
Copie o arquivo completo enviado anteriormente.

### `.env`
```
APIFY_API_TOKEN=apify_api_SBarnMV5RGlGLhib3X3WiINQpwmZCW4mcEuw
PORT=3000
```

### `.env.example`
```
APIFY_API_TOKEN=sua_chave_aqui
PORT=3000
```

### `skills/reddit-analyst.md`
Copie o arquivo completo enviado anteriormente.

### `README.md`
Copie o arquivo completo enviado anteriormente.

### `package.json`
```json
{
  "name": "reddit-trading-analytics",
  "version": "1.0.0",
  "description": "Sistema de análise do Reddit para trading",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "node-fetch": "^3.3.2"
  }
}
```

## 4️⃣ Instalar Dependências

```bash
npm install
```

## 5️⃣ Executar

```bash
npm start
# ou
npm run dev
```

Acesse: **http://localhost:3000**

## 📋 Resumo dos Arquivos

- `package.json` - configuração do projeto
- `src/server.js` - servidor Express + API
- `src/apify-scraper.js` - integração Apify
- `src/classification.js` - classificação automática
- `src/analyzer.js` - motor de análise
- `dashboard/index.html` - interface
- `dashboard/styles.css` - estilos dark
- `dashboard/app.js` - lógica frontend
- `.env` - variáveis de ambiente
- `README.md` - documentação
- `skills/reddit-analyst.md` - skill para Claude

Pronto! Todos os arquivos estão aqui para copiar e colar.
