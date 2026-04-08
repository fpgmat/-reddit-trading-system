/**
 * Servidor Express Principal
 */

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

/**
 * Endpoint: Status
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint: Scraping manual
 */
app.post('/api/scrape', async (req, res) => {
  try {
    console.log('Iniciando scraping...');
    const posts = await scrapeReddit();
    console.log(`Coletados ${posts.length} posts`);

    const analysis = await analyzePosts(posts);

    // Salva resultado
    const fs = await import('fs');
    const path = await import('path');
    const output = {
      timestamp: new Date().toISOString(),
      stats: analysis.stats,
      dores: analysis.dores,
      perguntas: analysis.perguntas,
      tendencias: analysis.tendencias,
      oportunidades: analysis.oportunidades,
      keywords: analysis.keywords,
      rawPosts: posts.length
    };

    const filename = `data/analysis_${Date.now()}.json`;
    fs.promises.writeFile(filename, JSON.stringify(output, null, 2));

    res.json({
      success: true,
      message: `Analisados ${posts.length} posts`,
      data: output
    });
  } catch (error) {
    console.error('Erro no scraping:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint: Última análise
 */
app.get('/api/latest', async (req, res) => {
  const fs = await import('fs');
  const path = await import('path');

  try {
    const files = fs.readdirSync('data').filter(f => f.startsWith('analysis_'));
    if (files.length === 0) {
      return res.json({ exists: false });
    }

    const latest = files.sort().pop();
    const data = JSON.parse(fs.readFileSync(`data/${latest}`, 'utf8'));
    res.json({ exists: true, data });
  } catch {
    res.json({ exists: false });
  }
});

/**
 * Endpoint: Histórico
 */
app.get('/api/history', async (req, res) => {
  const fs = await import('fs');
  const path = await import('path');

  try {
    const files = fs.readdirSync('data').filter(f => f.startsWith('analysis_'));
    const history = files.map(f => {
      const [_, timestamp] = f.replace('.json', '').split('_');
      return { filename: f, date: new Date(parseInt(timestamp)) };
    }).sort((a, b) => b.date - a.date);

    res.json(history.slice(0, 10));
  } catch {
    res.json([]);
  }
});

/**
 * Dashboard
 */
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '../dashboard' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});
