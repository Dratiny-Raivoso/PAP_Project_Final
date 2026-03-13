/* ═══════════════════════════════════════════════════════
   LED · js/requisicoes.js
   Lógica do sistema de requisições
═══════════════════════════════════════════════════════ */

let todasRequisicoes = [];

/* ═══════════════════════════════════════════════════════
   CARREGAR REQUISIÇÕES DA API
═══════════════════════════════════════════════════════ */
async function carregarRequisicoes() {
  try {
    const res = await apiFetch('/api/requisicoes');
    if (!res) return;

    todasRequisicoes = await res.json();

    atualizarStatsRequisicoes();
    renderizarRequisicoes(todasRequisicoes);
    atualizarBadgeRequisicoes();

  } catch (err) {
    console.error('Erro ao carregar requisições:', err);
  }
}

/* ── Badge da sidebar ────────────────────────────────── */
function atualizarBadgeRequisicoes() {
  const ativas    = todasRequisicoes.filter(r => r.estado === 'ativa').length;
  const atrasadas = todasRequisicoes.filter(r => r.estado === 'atrasada').length;
  const badge     = document.getElementById('req-badge');
  if (badge) badge.textContent = ativas + atrasadas;
}

/* ── Stats rápidas ───────────────────────────────────── */
function atualizarStatsRequisicoes() {
  const ativas     = todasRequisicoes.filter(r => r.estado === 'ativa').length;
  const atrasadas  = todasRequisicoes.filter(r => r.estado === 'atrasada').length;
  const devolvidas = todasRequisicoes.filter(r => r.estado === 'devolvida').length;

  const elAtivas     = document.getElementById('req-stat-ativas');
  const elAtrasadas  = document.getElementById('req-stat-atrasadas');
  const elDevolvidas = document.getElementById('req-stat-devolvidas');

  if (elAtivas)     elAtivas.textContent     = ativas;
  if (elAtrasadas)  elAtrasadas.textContent  = atrasadas;
  if (elDevolvidas) elDevolvidas.textContent = devolvidas;
}


/* ═══════════════════════════════════════════════════════
   RENDERIZAR TABELA DE REQUISIÇÕES
═══════════════════════════════════════════════════════ */
function renderizarRequisicoes(lista) {
  const tbody = document.getElementById('req-table-body');
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <p>Sem requisições para mostrar</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(req => {
    const equipamento = req.equipamentoId;
    const utilizador  = req.userId;

    const dataReq  = formatarData(req.dataRequisicao);
    const dataDev  = formatarData(req.dataDevolucaoPrevista);
    const hoje     = new Date();
    const prevista = new Date(req.dataDevolucaoPrevista);
    const diasRestantes = Math.ceil((prevista - hoje) / (1000 * 60 * 60 * 24));

    // Cor e texto do estado
    const estadoConfig = {
      ativa:     { cor: 'var(--green)',  texto: '● Ativa' },
      atrasada:  { cor: 'var(--pink)',   texto: '● Atrasada' },
      devolvida: { cor: 'var(--text-muted)', texto: '● Devolvida' },
    };
    const estado = estadoConfig[req.estado] || estadoConfig.ativa;

    // Aviso de dias restantes
    let avisoData = `<span style="font-size:11px; color:var(--text-muted);">${dataDev}</span>`;
    if (req.estado === 'ativa') {
      if (diasRestantes < 0) {
        avisoData = `<span style="font-size:11px; color:var(--pink); font-weight:600;">${dataDev} (${Math.abs(diasRestantes)}d atraso)</span>`;
      } else if (diasRestantes <= 2) {
        avisoData = `<span style="font-size:11px; color:var(--orange); font-weight:600;">${dataDev} (${diasRestantes}d restantes)</span>`;
      } else {
        avisoData = `<span style="font-size:11px; color:var(--text-muted);">${dataDev}</span>`;
      }
    }

    // Botões de ação
    const botoesAtivos = req.estado !== 'devolvida'
      ? `<button onclick="devolverRequisicao('${req._id}')" style="background:rgba(77,184,75,0.1);border:1px solid rgba(77,184,75,0.3);color:var(--green);padding:3px 10px;border-radius:4px;font-size:11px;cursor:pointer;font-weight:600;">✅ Devolver</button>
         <button onclick="cancelarRequisicao('${req._id}')" style="background:rgba(224,23,110,0.1);border:1px solid rgba(224,23,110,0.3);color:var(--pink);padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;">🗑️</button>`
      : `<span style="font-size:11px; color:var(--text-muted);">Devolvido em ${formatarData(req.dataDevolucaoReal)}</span>`;

    return `
      <tr>
        <td>
          <span class="kit-badge">${equipamento?.kit || '—'}</span>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${equipamento?.descricao || ''}">${equipamento?.descricao || '—'}</div>
        </td>
        <td>
          <div style="font-size:13px; font-weight:600;">${utilizador?.name || '—'}</div>
          <div style="font-size:11px; color:var(--text-muted);">${utilizador?.email || ''}</div>
        </td>
        <td style="font-size:12px; color:var(--text-muted);">${dataReq}</td>
        <td>${avisoData}</td>
        <td><span style="font-size:12px; font-weight:600; color:${estado.cor}">${estado.texto}</span></td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            ${botoesAtivos}
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ── Formatar data ───────────────────────────────────── */
function formatarData(data) {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-PT', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });
}

/* ── Filtrar por estado ──────────────────────────────── */
function filtrarRequisicoes(btn, estado) {
  document.querySelectorAll('#page-requisicoes .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const filtradas = estado === 'todas'
    ? todasRequisicoes
    : todasRequisicoes.filter(r => r.estado === estado);

  renderizarRequisicoes(filtradas);
}


/* ═══════════════════════════════════════════════════════
   MODAL — NOVA REQUISIÇÃO
═══════════════════════════════════════════════════════ */
async function abrirNovaRequisicao() {
  // Popular o select com equipamentos disponíveis
  const select = document.getElementById('req-equipamento');
  select.innerHTML = '<option value="">Seleciona um equipamento</option>';

  const disponiveis = todosEquipamentos.filter(e =>
    e.estado === 'disponivel' && e.quantidadeDisponivel > 0
  );

  if (!disponiveis.length) {
    select.innerHTML = '<option value="">Nenhum equipamento disponível</option>';
  } else {
    disponiveis.forEach(e => {
      select.innerHTML += `<option value="${e._id}">[${e.kit}] ${e.descricao} (${e.quantidadeDisponivel} disponíveis)</option>`;
    });
  }

  // Data mínima = hoje
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('req-data-devolucao').min   = hoje;
  document.getElementById('req-data-devolucao').value = '';
  document.getElementById('req-notas').value          = '';
  document.getElementById('req-erro').style.display   = 'none';

  document.getElementById('req-modal').classList.add('active');
}

function fecharReqModal() {
  document.getElementById('req-modal').classList.remove('active');
}

async function guardarRequisicao() {
  const equipamentoId        = document.getElementById('req-equipamento').value;
  const dataDevolucaoPrevista = document.getElementById('req-data-devolucao').value;
  const notas                = document.getElementById('req-notas').value.trim();
  const err                  = document.getElementById('req-erro');
  const btn                  = document.getElementById('req-btn-guardar');

  if (!equipamentoId || !dataDevolucaoPrevista) {
    err.style.display = 'block';
    err.textContent   = 'Seleciona o equipamento e a data de devolução.';
    return;
  }

  btn.textContent = 'A criar...';
  btn.disabled    = true;

  try {
    const res = await apiFetch('/api/requisicoes', {
      method: 'POST',
      body:   JSON.stringify({ equipamentoId, dataDevolucaoPrevista, notas }),
    });

    if (!res) return;
    const data = await res.json();

    if (!res.ok) {
      err.style.display = 'block';
      err.textContent   = data.erro || 'Erro ao criar requisição.';
      return;
    }

    fecharReqModal();
    // Recarregar requisições e equipamentos (estado atualizado)
    await carregarRequisicoes();
    await carregarEquipamentos();

  } catch (e) {
    err.style.display = 'block';
    err.textContent   = 'Erro de ligação ao servidor.';
  } finally {
    btn.textContent = 'Criar Requisição';
    btn.disabled    = false;
  }
}


/* ═══════════════════════════════════════════════════════
   DEVOLVER EQUIPAMENTO
═══════════════════════════════════════════════════════ */
async function devolverRequisicao(id) {
  if (!confirm('Confirmas a devolução deste equipamento?')) return;

  try {
    const res = await apiFetch(`/api/requisicoes/${id}/devolver`, { method: 'PUT' });
    if (!res) return;

    const data = await res.json();
    if (!res.ok) {
      alert('Erro: ' + (data.erro || 'Não foi possível registar a devolução.'));
      return;
    }

    // Recarregar tudo
    await carregarRequisicoes();
    await carregarEquipamentos();

  } catch (e) {
    alert('Erro de ligação ao servidor.');
  }
}


/* ═══════════════════════════════════════════════════════
   CANCELAR REQUISIÇÃO
═══════════════════════════════════════════════════════ */
async function cancelarRequisicao(id) {
  if (!confirm('Tens a certeza que queres cancelar esta requisição?\nO equipamento voltará a estar disponível.')) return;

  try {
    const res = await apiFetch(`/api/requisicoes/${id}`, { method: 'DELETE' });
    if (!res) return;

    const data = await res.json();
    if (!res.ok) {
      alert('Erro: ' + (data.erro || 'Não foi possível cancelar.'));
      return;
    }

    await carregarRequisicoes();
    await carregarEquipamentos();

  } catch (e) {
    alert('Erro de ligação ao servidor.');
  }
}