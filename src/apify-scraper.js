/**
 * Apify Reddit Scraper Integration
 * Actor: apify/reddit-scraper
 */

const SUBREDDITS = {
  geral: ['Daytrading', 'swingtrading', 'stocks', 'options', 'algotrading'],
  brasil: ['investimentos', 'BrazilStocks', 'farialimabets'],
  automacao: ['TradingView', 'Python']
};

const SCRAPE_CONFIG = {
  sort: ['top', 'new'],
  time: 'month',
  maxPosts: 500,
  minUpvotes: 5,
  minComments: 3
};

/**
 * Executa o scraping via Apify API
 */
async function scrapeReddit() {
  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    throw new Error('APIFY_API_TOKEN não configurado');
  }

  const allPosts = [];

  for (const category of Object.keys(SUBREDDITS)) {
    for (const subreddit of SUBREDDITS[category]) {
      try {
        const posts = await callApifyActor(token, subreddit, SCRAPE_CONFIG);
        allPosts.push(...posts.map(p => ({
          ...p,
          category,
          subreddit: `r/${subreddit}`
        })));
      } catch (error) {
        console.error(`Erro ao raspar r/${subreddit}:`, error.message);
      }
    }
  }

  return allPosts;
}

/**
 * Chama o actor do Apify
 */
async function callApifyActor(token, subreddit, config) {
  const url = 'https://api.apify.com/v2/acts/apify~reddit-scraper/run-sync-get-dataset-items';

  const params = new URLSearchParams({
    token,
    format: 'json'
  });

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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro na API Apify');
  }

  const data = await response.json();
  return data || [];
}

export { scrapeReddit, SUBREDDITS, SCRAPE_CONFIG };
