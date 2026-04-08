/**
 * Dashboard Frontend - Reddit Trading Analytics
 */

const API_BASE = '';

async function novaRaspagem() {
  const overlay = document.getElementById('loadingOverlay');
  const status = document.getElementById('statusBar');
  const indicator = status.querySelector('.status-indicator');
  const statusText = status.querySelector('.status-text');

  overlay.style.display = 'flex';

  indicator.className = 'status-indicator busy';
  statusText.textContent = 'Raspando Reddit...';

  try {
    const response = await fetch(`${API_BASE}/api/scrape`, {
      method: 'POST'
    });

    const result = await response.json();

    if (result.success) {
      statusText.textContent = `Concluído: ${result.data.stats.totalPosts} posts analisados`;
      updateDashboard(result.data);
    } else {
      statusText.textContent = `Erro: ${result.error}`;
      indicator.className = 'status-indicator error';
    }
  } catch (error) {
    console.error(error);
    statusText.textContent = `Erro de conexão`;
    indicator.className = 'status-indicator error';
  } finally {
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 1000);
  }
}

function renderDores(dores) {
  const container = document.getElementById('doresList');
  document.getElementById('doresCount').textContent = dores.length;

  if (!dores || dores.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">○</span>
        <p>Nenhuma dor identificada</p>
      </div>`;
    return;
  }

  container.innerHTML = dores.map(d => `
    <div class="item-card">
      <div class="item-card-header">
        <span class="item-title">${d.descricao}</span>
        <span class="badge ${d.frequencia}">${d.frequencia}</span>
      </div>
      ${d.exemplo ? `<div class="item-example">"${d.exemplo.substring(0, 80)}..."</div>` : ''}
      <div class="item-meta">
        <span class="meta-tag">Impacto: ${d.impacto}</span>
      </div>
    </div>
  `).join('');
}

function renderPerguntas(perguntas) {
  const container = document.getElementById('perguntasList');
  document.getElementById('perguntasCount').textContent = perguntas.length;

  if (!perguntas || perguntas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">○</span>
        <p>Nenhuma pergunta destacada</p>
      </div>`;
    return;
  }

  container.innerHTML = perguntas.map(p => `
    <div class="item-card">
      <div class="item-card-header">
        <span class="item-title">${p.pergunta}</span>
      </div>
      <div class="item-meta">
        <span class="meta-tag upvotes">▲ ${p.engajamento}</span>
        <span class="meta-tag comments">💬 ${p.comentarios}</span>
        <span class="meta-tag solved ${p.status === 'sim' ? 'alta' : 'baixa'}">
          ${p.status === 'sim' ? '✔ Resolvida' : '✘ Sem resposta clara'}
        </span>
      </div>
    </div>
  `).join('');
}

function renderTendencias(tendencias) {
  const container = document.getElementById('tendenciasList');
  document.getElementById('tendenciasCount').textContent = tendencias.length;

  if (!tendencias || tendencias.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">○</span>
        <p>Nenhuma tendência detectada</p>
      </div>`;
    return;
  }

  const maxMentions = Math.max(...tendencias.map(t => t.mencoes));

  container.innerHTML = tendencias.map(t => {
    const percent = (t.mencoes / maxMentions) * 100;
    const color = t.tendencia === 'forte' ? 'var(--accent-green)' :
                  t.tendencia === 'media' ? 'var(--accent-orange)' : 'var(--accent-blue)';
    return `
      <div class="trend-item">
        <span class="trend-theme">${t.tema}</span>
        <span class="trend-metric">${t.mencoes} menções</span>
        <div class="trend-bar">
          <div class="trend-fill" style="width: ${percent}%; background: ${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderOportunidades(oportunidades) {
  const container = document.getElementById('oportunidadesList');
  document.getElementById('oportunidadesCount').textContent = oportunidades.length;

  if (!oportunidades || oportunidades.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">○</span>
        <p>Nenhuma oportunidade identificada</p>
      </div>`;
    return;
  }

  container.innerHTML = oportunidades.map(o => `
    <div class="opportunity-card">
      <div class="opportunity-title">${o.ideia}</div>
      <span class="opportunity-type">${o.tipo === 'video' ? '📺 YouTube' : '📚 Produto'}</span>
      <div class="opportunity-reason">${o.justificativa} • Demanda: ${o.demanda}</div>
    </div>
  `).join('');
}

function renderKeywords(keywords) {
  const container = document.getElementById('keywordsGrid');

  if (!keywords || keywords.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted)">Sem keywords</p>';
    return;
  }

  container.innerHTML = keywords.map(k => `
    <span class="keyword-tag">
      ${k.word}
      <span class="keyword-count">${k.count}</span>
    </span>
  `).join('');
}

function updateHeaderStats(stats) {
  const statsEl = document.getElementById('headerStats');
  statsEl.innerHTML = `
    <span class="stat-item">Posts: <strong>${stats.totalPosts}</strong></span>
    <span class="stat-item">Subreddits: <strong>${stats.subreddits}</strong></span>
    <span class="stat-item">Período: <strong>mês</strong></span>
  `;
}

async function updateDashboard(data) {
  renderDores(data.dores || []);
  renderPerguntas(data.perguntas || []);
  renderTendencias(data.tendencias || []);
  renderOportunidades(data.oportunidades || []);
  renderKeywords(data.keywords || []);
  updateHeaderStats(data.stats || {});
}

async function loadLatest() {
  try {
    const response = await fetch(`${API_BASE}/api/latest`);
    const result = await response.json();

    if (result.exists) {
      updateDashboard(result.data);
      const indicator = document.querySelector('.status-indicator');
      const statusText = document.querySelector('.status-text');
      indicator.className = 'status-indicator';
      statusText.textContent = 'Dados carregados';
    }
  } catch (error) {
    console.error('Erro ao carregar último:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadLatest();
});
