/**
 * Motor de Busca Direto (Ultra-Rápido)
 * Substitui o antigo Apify por acesso nativo e invisível ao Reddit.
 */
import fetch from 'node-fetch'; 

const SUBREDDITS = {
  geral: ['Daytrading', 'swingtrading', 'stocks', 'options', 'algotrading'],
  brasil: ['investimentos', 'BrazilStocks', 'farialimabets'],
  automacao: ['TradingView', 'Python']
};

const SCRAPE_CONFIG = {
  maxPosts: 100, // Limite maximo instantâneo e seguro de dados coletados por carga
  minUpvotes: 5,
  minComments: 3
};

async function scrapeReddit() {
  const allPosts = [];

  for (const category of Object.keys(SUBREDDITS)) {
    for (const subreddit of SUBREDDITS[category]) {
      try {
        const posts = await callRedditDirectJSON(subreddit, SCRAPE_CONFIG);
        
        // Formata igualzinho os arquivos Apify faziam para agradar o Motor de estatísticas
        allPosts.push(...posts.map(p => ({
          ...p,
          category,
          subreddit: `r/${subreddit}`
        })));
      } catch (error) {
        console.error(`Erro ao espionar o r/${subreddit}:`, error.message);
      }
    }
  }

  return allPosts;
}

async function callRedditDirectJSON(subreddit, config) {
  // Acesso direto que roda igual um raio e burla a lentidão
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${config.maxPosts}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) / Reddit-Dash-Analytics' }
  });

  if (!response.ok) {
    throw new Error(`Reddit rate limit ou sub não encontrado`);
  }

  const json = await response.json();
  const children = json?.data?.children || [];

  return children
    .map(child => ({
      title: child.data.title || '',
      content: child.data.selftext || '',
      upvotes: child.data.ups || child.data.score || 0,
      num_comments: child.data.num_comments || 0,
      url: child.data.url
    }))
    .filter(p => p.upvotes >= config.minUpvotes && p.num_comments >= config.minComments);
}

export { scrapeReddit, SUBREDDITS, SCRAPE_CONFIG };
