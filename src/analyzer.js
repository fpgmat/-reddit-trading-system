/**
 * Motor de Análise - Identifica dores, perguntas, tendências e oportunidades
 */

/**
 * Detecta se o post é uma pergunta
 */
function isQuestion(text) {
  const questionMarkers = ['?', 'como', 'why', 'what', 'when', 'help', 'dúvida', 'alguém', '?'];
  text = text.toLowerCase();
  return questionMarkers.some(m => text.includes(m));
}

/**
 * Detecta se o post é uma lamentação/perda
 */
function isComplaint(text) {
  const complaintMarkers = ['lost', 'perdi', 'perda', 'loss', 'erro', 'mistake', 'deu ruim', 'quebrado', 'stopado', 'bambu'];
  text = text.toLowerCase();
  return complaintMarkers.some(m => text.includes(m));
}

/**
 * Extrai palavras-chave relevantes (simple frequency)
 */
function extractKeywords(posts) {
  const frequencies = new Map();

  for (const post of posts) {
    const words = (post.title + ' ' + (post.content || '')).toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);

    for (const word of words) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
  }

  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Detecta padrões repetidos (tendências)
 */
function detectTrends(posts) {
  const themes = new Map();

  for (const post of posts) {
    const text = (post.title + ' ' + (post.content || '')).toLowerCase();
    const themeTriggers = {
      'quant': ['quant', 'backtest', 'strategy', 'indicador', 'estatística'],
      'ia': ['ai', 'machine learning', 'neural', 'llm', 'gpt', 'chatgpt'],
      'crypto': ['bitcoin', 'crypto', 'ethereum', 'blockchain'],
      'bruto': ['bruto', 'carteira', 'dividendos', 'fii', 'renda fixa'],
      'swing': ['swing', 'position', 'hold'],
      'ta': ['ta', 'technical analysis', 'chart', 'gráfico', 'candlestick']
    };

    for (const [theme, triggers] of Object.entries(themeTriggers)) {
      if (triggers.some(t => text.includes(t))) {
        themes.set(theme, (themes.get(theme) || 0) + 1);
      }
    }
  }

  return Array.from(themes.entries())
    .filter(([_, count]) => count >= 3)
    .map(([theme, count]) => ({
      tema: theme,
      mencoes: count,
      tendencia: count >= 10 ? 'forte' : count >= 5 ? 'media' : 'fraca'
    }));
}

/**
 * Agrupa posts similares
 */
function groupSimilarPosts(posts) {
  const groups = [];

  for (const post of posts) {
    const group = posts.filter(p =>
      (post.tipo === p.tipo || post.mercado === p.mercado) &&
      post !== p &&
      similarityScore(post.title, p.title) > 0.6
    );

    if (group.length >= 2 && !groups.find(g => g.posts.includes(post))) {
      groups.push({
        tipo: post.tipo,
        mercado: post.mercado,
        posts: [post, ...group]
      });
    }
  }

  return groups;
}

/**
 * Similaridade simples de texto
 */
function similarityScore(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  return intersection / Math.min(wordsA.size, wordsB.size);
}

/**
 * Análise principal
 */
export async function analyzePosts(posts) {
  const classifiedPosts = posts.map(p => classifyPost(p));

  // Separar por categorias
  const complaints = classifiedPosts.filter(isComplaint);
  const questions = classifiedPosts.filter(isQuestion);

  // Extrair dores
  const dores = [];
  for (const post of complaints) {
    const issues = detectSpecificIssues(post);
    for (const issue of issues) {
      const existing = dores.find(d => d.descricao === issue);
      if (existing) {
        existing.frequencia++;
        existing.exemplos.push(post.title);
      } else {
        dores.push({
          descricao: issue,
          frequencia: 1,
          impacto: 'medio',
          exemplos: [post.title]
        });
      }
    }
  }

  // Extrair perguntas
  const perguntas = [];
  for (const post of questions) {
    const extractedQuestion = extractCoreQuestion(post);
    const existing = perguntas.find(p => p.texto === extractedQuestion);
    if (!existing) {
      perguntas.push({
        texto: extractedQuestion,
        upvotes: post.upvotes,
        comentarios: post.comments || post.num_comments || 0,
        respostasClaras: countClearAnswers(post),
        essaClareza: post.resposta_clara ? 'sim' : 'nao'
      });
    }
  }

  // Tendências
  const tendencias = detectTrends(classifiedPosts);

  // Oportunidades (nichos pouco explorados)
  const keywordFreq = extractKeywords(classifiedPosts);
  const lowCompetition = keywordFreq.filter(k =>
    k.count >= 2 && k.count <= 5
  ).slice(0, 10);

  const oportunidades = [];

  for (const kw of lowCompetition) {
    const relatedPosts = classifiedPosts.filter(p =>
      (p.title + ' ' + (p.content || '')).toLowerCase().includes(kw.word)
    );

    if (relatedPosts.length > 0) {
      const avgEngagement = relatedPosts.reduce((sum, p) => sum + (p.upvotes || 0), 0) / relatedPosts.length;
      oportunidades.push({
        ideia: `Conteúdo sobre "${kw.word}"`,
        tipo: avgEngagement > 50 ? 'video' : 'curso',
        justificativa: `Pouco conteúdo mas interesse detectado (${kw.count} menções)`,
        demanda: avgEngagement > 100 ? 'alta' : 'media'
      });
    }
  }

  // Estatísticas
  const stats = {
    totalPosts: posts.length,
    subreddits: new Set(classifiedPosts.map(p => p.subreddit)).size,
    period: 'month',
    categorias: classifiedPosts.reduce((acc, p) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1;
      return acc;
    }, {})
  };

  return {
    dores: dores.sort((a, b) => b.frequencia - a.frequencia).slice(0, 15).map(d => ({
      descricao: d.descricao,
      frequencia: d.frequencia > 5 ? 'alta' : d.frequencia > 2 ? 'media' : 'baixa',
      impacto: d.impacto,
      exemplo: d.exemplos[0] || ''
    })),
    perguntas: perguntas
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 20)
      .map(p => ({
        pergunta: p.texto,
        engajamento: p.upvotes,
        comentarios: p.comentarios,
        respostasClaras: p.respostasClaras,
        status: p.essaClareza
      })),
    tendencias: tendencias,
    oportunidades: oportunidades,
    keywords: keywordFreq.slice(0, 20),
    stats
  };
}

/**
 * Detecta problemas específicos em um post
 */
function detectSpecificIssues(post) {
  const text = (post.title + ' ' + (post.content || '')).toLowerCase();
  const issues = [];

  const issueMap = {
    'stop atingido': ['stopado', 'stop loss', 'stop-loss', 'bambu'],
    'falta de disciplina': ['faltou disciplina', 'disciplina', 'emocional'],
    'erro de cálculo': ['errei', 'calculei errado', 'mirei errado'],
    'FOMO': ['fomo', 'medo de perder', 'arrependido', 'quitou'],
    'sem confiança': ['sem confiança', 'duvido', 'incerto', 'duvida'],
    'dificuldade técnica': ['indicador', 'estratégia', 'setup', 'sinal'],
    'gestão de risco': ['position size', 'risco', 'gestão', 'risk management']
  };

  for (const [issue, markers] of Object.entries(issueMap)) {
    if (markers.some(m => text.includes(m))) {
      issues.push(issue);
    }
  }

  return issues;
}

/**
 * Extrai a pergunta central de um post
 */
function extractCoreQuestion(post) {
  let text = post.title;

  if (text.toLowerCase().includes('?')) {
    return text;
  }

  // Tenta encontrar a primeira frase interrogativa
  const sentences = text.split(/[.!?]/);
  const question = sentences.find(s => s.toLowerCase().includes('how') ||
    s.toLowerCase().includes('what') ||
    s.includes('?'));
  return question || text;
}

/**
 * Conta respostas claras (simplificado)
 */
function countClearAnswers(post) {
  if (!post.comments_list) return 0;

  const clarityMarkers = ['sim', 'yes', 'funciona', 'works', 'tested', 'testei'];
  return post.comments_list.filter(c => {
    const body = (c.body || '').toLowerCase();
    return clarityMarkers.some(m => body.includes(m));
  }).length;
}
