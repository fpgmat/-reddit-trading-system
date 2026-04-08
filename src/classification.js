/**
 * Sistema de Classificação Automática
 */

const KEYWORDS = {
  swing: ['swing', 'holding', ' weeks', 'months', 'position', 'medium term'],
  day: ['day trade', 'intraday', 'scalping', 'daytrade', 'intra'],
  options: ['option', 'call', 'put', 'strike', 'theta', 'iv', 'implied volatility'],
  automation: ['python', 'bot', 'api', 'automation', 'script', 'algorithmic', 'backtest'],
  long_short: ['long', 'short', 'hedge', 'pair trade']
};

const MARKET_KEYWORDS = {
  b3: ['b3', 'brasil', 'ibovespa', 'petr4', 'vale3', 'itub4', 'ambev', 'brasilian'],
  eua: ['nasdaq', 'sp500', 'dow', 'nyse', 'nasdaq', 'qqq', 'spy', 'amd', 'nvda', 'aapl', 'tsla', 'microsoft', 'google'],
  global: ['forex', 'eur/usd', 'crypto', 'bitcoin', 'ethereum', 'gold', 'oil']
};

const LEVEL_KEYWORDS = {
  iniciante: ['beginner', 'starting', 'newbie', 'primeiros', 'aprender', 'noob', 'iniciar', 'como começar'],
  intermediario: ['intermediate', 'improving', 'melhorar', 'estrategia', 'tatica'],
  avancado: ['advanced', 'quant', 'hft', 'complex', 'sophisticated', 'professional', 'avançado']
};

/**
 * Classifica o tipo de trading
 */
function classifyType(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();

  for (const [type, words] of Object.entries(KEYWORDS)) {
    for (const word of words) {
      if (text.includes(word)) {
        return type === 'long_short' ? 'Long & Short' : type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
      }
    }
  }

  return 'Geral';
}

/**
 * Classifica o mercado
 */
function classifyMarket(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();

  for (const [market, words] of Object.entries(MARKET_KEYWORDS)) {
    for (const word of words) {
      if (text.includes(word)) {
        return market.toUpperCase();
      }
    }
  }

  return 'Global';
}

/**
 * Classifica o nível
 */
function classifyLevel(title, content = '') {
  const text = (title + ' ' + content).toLowerCase();

  for (const [level, words] of Object.entries(LEVEL_KEYWORDS)) {
    for (const word of words) {
      if (text.includes(word)) {
        return level.charAt(0).toUpperCase() + level.slice(1);
      }
    }
  }

  return 'Intermediário';
}

/**
 * Classifica um post completo
 */
export function classifyPost(post) {
  return {
    ...post,
    tipo: classifyType(post.title, post.content || post.selftext || ''),
    mercado: classifyMarket(post.title, post.content || post.selftext || ''),
    nivel: classifyLevel(post.title, post.content || post.selftext || '')
  };
}
