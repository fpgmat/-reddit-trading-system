/**
 * Integrador Apify Final:
 * Mapeamento de Títulos como filtro (blindado contra lixos de dataType)
 */
import fetch from 'node-fetch';

const SUBREDDITS = {
  geral: ['Daytrading', 'swingtrading', 'stocks', 'options', 'algotrading'],
  brasil: ['investimentos', 'BrazilStocks', 'farialimabets'],
  automacao: ['TradingView', 'Python']
};

const SCRAPE_CONFIG = {
  maxItems: 15, // O suficiente para extrair uma porrada de dados bons rápido
  minUpvotes: 5,
  minComments: 3
};

export async function scrapeReddit() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_API_TOKEN não está configurado');

  const startUrls = [];
  for (const category of Object.keys(SUBREDDITS)) {
    for (const sub of SUBREDDITS[category]) {
      startUrls.push({ url: `https://www.reddit.com/r/${sub}/top/` });
    }
  }

  // Acionando todos os robos da Apify em paralelo de uma vez
  const actorUrl = 'https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/run-sync-get-dataset-items';
  
  const response = await fetch(`${actorUrl}?token=${token}&format=json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: startUrls,
      maxItems: SCRAPE_CONFIG.maxItems * startUrls.length 
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(()=>({}));
    throw new Error(`Falha no Apify Trudax: ${err.message || response.statusText}`);
  }

  const rawData = await response.json();
  const allPosts = [];

  for (const item of rawData) {
    // 🔥 A Mágica de verdade que estava faltando 🔥
    // Se não tiver Título ou for url furada, ele destarta na hora. Isso isola todos os comentários!
    if (!item.title || item.title.trim() === '') continue;
    if (!item.url || !item.url.includes('/r/')) continue;
    
    // Pega o nome do subreddit de onde veio do link
    const regexMatch = item.url.match(/reddit\.com\/r\/([^/]+)/);
    let subName = regexMatch ? regexMatch[1] : 'unknown';
    
    // Busca a categoria baseado na lista que foi configurada lá em cima
    let assignedCategory = 'geral';
    for (const [cat, lista] of Object.entries(SUBREDDITS)) {
      if (lista.find(nm => nm.toLowerCase() === subName.toLowerCase())) {
        assignedCategory = cat;
        break;
      }
    }

    const formatado = {
      title: item.title,
      content: item.text || item.content || item.html || '',
      upvotes: item.upVotes || item.upvotes || item.score || 0, 
      num_comments: item.numberOfreplies || item.comments || item.numComments || 0,
      url: item.url,
      subreddit: `r/${subName}`,
      category: assignedCategory
    };

    // Aprovando apenas se tiverem métricas quentes de interação e votos (Mínimo de 5 Upvotes e 3 Comentários)
    if (formatado.upvotes >= SCRAPE_CONFIG.minUpvotes && formatado.num_comments >= SCRAPE_CONFIG.minComments) {
      allPosts.push(formatado);
    }
  }

  return allPosts;
}

export { SUBREDDITS, SCRAPE_CONFIG };
