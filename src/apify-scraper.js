/**
 * Integrador Apify Turbinado:
 * Usa o Ator trudax/reddit-scraper-lite que funciona após os cortes.
 */
import fetch from 'node-fetch';

const SUBREDDITS = {
  geral: ['Daytrading', 'swingtrading', 'stocks', 'options', 'algotrading'],
  brasil: ['investimentos', 'BrazilStocks', 'farialimabets'],
  automacao: ['TradingView', 'Python']
};

const SCRAPE_CONFIG = {
  maxItems: 30, // 30 por fórum, máximo seguro pra Render não estourar o limite de 2 minutos gratuitos.
  minUpvotes: 5,
  minComments: 3
};

export async function scrapeReddit() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_API_TOKEN não está configurado nas Variables da Render');

  const startUrls = [];
  for (const category of Object.keys(SUBREDDITS)) {
    for (const sub of SUBREDDITS[category]) {
      startUrls.push({ url: `https://www.reddit.com/r/${sub}/top/` });
    }
  }

  // Envia tudo empacotado de uma única vez para não perder tempo com For-Loops
  const actorUrl = 'https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/run-sync-get-dataset-items';
  
  const response = await fetch(`${actorUrl}?token=${token}&format=json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: startUrls,
      maxItems: SCRAPE_CONFIG.maxItems * startUrls.length // Limite global que pedimos pra apify
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(()=>({}));
    throw new Error(`Falha no Apify Trudax: ${err.message || response.statusText}`);
  }

  const rawData = await response.json();
  const allPosts = [];

  for (const item of rawData) {
    // Tratamentos pra barrar retornos lixos e formatar propriedades de acordo pro Analyzer
    if (!item.url || !item.url.includes('/r/')) continue;
    
    // Descobre com Regex de qual sub ele veio da URL gerada
    const regexMatch = item.url.match(/reddit\.com\/r\/([^/]+)/);
    let subName = regexMatch ? regexMatch[1] : 'unknown';
    
    // Avalia o sub achado para colocar a categoria certinha
    let assignedCategory = 'geral';
    for (const [cat, lista] of Object.entries(SUBREDDITS)) {
      if (lista.find(nm => nm.toLowerCase() === subName.toLowerCase())) {
        assignedCategory = cat;
        break;
      }
    }

    const formatado = {
      title: item.title || '',
      content: item.text || item.content || '',
      upvotes: item.upvotes || item.score || 0,
      num_comments: item.comments || item.numComments || 0,
      url: item.url,
      subreddit: `r/${subName}`,
      category: assignedCategory
    };

    if (formatado.upvotes >= SCRAPE_CONFIG.minUpvotes && formatado.num_comments >= SCRAPE_CONFIG.minComments) {
      allPosts.push(formatado);
    }
  }

  return allPosts;
}

export { SUBREDDITS, SCRAPE_CONFIG };
