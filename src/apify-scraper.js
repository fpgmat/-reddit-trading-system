/**
 * Integrador Apify Turbinado:
 * Mapeamento perfeito das pontuações (upVotes) - Anti-Falhas.
 */
import fetch from 'node-fetch';

const SUBREDDITS = {
  geral: ['Daytrading', 'swingtrading', 'stocks', 'options', 'algotrading'],
  brasil: ['investimentos', 'BrazilStocks', 'farialimabets'],
  automacao: ['TradingView', 'Python']
};

const SCRAPE_CONFIG = {
  maxItems: 15, // Mais rápido! Serão cerca de ~120 posts focados em pura qualidade sem travar seu Render
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

  // Envia tudo empacotado de uma única vez para não perder tempo
  const actorUrl = 'https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/run-sync-get-dataset-items';
  
  const response = await fetch(`${actorUrl}?token=${token}&format=json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // maxItems global para não causar Timeout
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
    // 🛡️ Filtra respostas lixo (retira "comments" que o robô empurra no meio e URLs inválidas)
    if (!item.url || !item.url.includes('/r/')) continue;
    if (item.dataType && item.dataType !== 'post') continue; 
    
    // Descobre facilmente a categoria de qual Fórum (Sub) ele veio
    const regexMatch = item.url.match(/reddit\.com\/r\/([^/]+)/);
    let subName = regexMatch ? regexMatch[1] : 'unknown';
    
    let assignedCategory = 'geral';
    for (const [cat, lista] of Object.entries(SUBREDDITS)) {
      if (lista.find(nm => nm.toLowerCase() === subName.toLowerCase())) {
        assignedCategory = cat;
        break;
      }
    }

    // ⭐ Aqui Consertamos o erro do Painel Vazio (Mapeando do Dicionário exato de retorno V.Maiusculo) 
    const formatado = {
      title: item.title || '',
      content: item.text || item.content || item.html || '',
      upvotes: item.upVotes || item.upvotes || item.score || 0, 
      num_comments: item.numberOfreplies || item.comments || item.numComments || 0,
      url: item.url,
      subreddit: `r/${subName}`,
      category: assignedCategory
    };

    // Última validação de engajamento do seu Projeto original
    if (formatado.upvotes >= SCRAPE_CONFIG.minUpvotes && formatado.num_comments >= SCRAPE_CONFIG.minComments) {
      allPosts.push(formatado);
    }
  }

  return allPosts;
}

export { SUBREDDITS, SCRAPE_CONFIG };
