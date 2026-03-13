/* ═══════════════════════════════════════════════════════
   LED · js/projetos.js
   Lógica da página de projetos
═══════════════════════════════════════════════════════ */

let todosProjetos  = [];
let projetoEmEdicao = null;

/* ═══════════════════════════════════════════════════════
   CARREGAR PROJETOS
═══════════════════════════════════════════════════════ */
async function carregarProjetos() {
  try {
    const res = await apiFetch('/api/projetos');
    if (!res) return;
    todosProjetos = await res.json();
    renderizarProjetos(todosProjetos);
    atualizarStatsProjetos();
    atualizarBadgeProjetos();
  } catch (err) {
    console.error('Erro ao carregar projetos:', err);
  }
}

function atualizarBadgeProjetos() {
  const badge = document.getElementById('proj-badge');
  if (badge) badge.textContent = todosProjetos.filter(p => p.estado === 'ativo').length;
}

function atualizarStatsProjetos() {
  const ativos     = todosProjetos.filter(p => p.estado === 'ativo').length;
  const pausados   = todosProjetos.filter(p => p.estado === 'pausado').length;
  const concluidos = todosProjetos.filter(p => p.estado === 'concluido').length;

  const el = (id) => document.getElementById(id);
  if (el('proj-stat-ativos'))     el('proj-stat-ativos').textContent     = ativos;
  if (el('proj-stat-pausados'))   el('proj-stat-pausados').textContent   = pausados;
  if (el('proj-stat-concluidos')) el('proj-stat-concluidos').textContent = concluidos;
  if (el('proj-stat-total'))      el('proj-stat-total').textContent      = todosProjetos.length;
}


/* ═══════════════════════════════════════════════════════
   RENDERIZAR PROJETOS — CARDS
═══════════════════════════════════════════════════════ */
function renderizarProjetos(lista) {
  const container = document.getElementById('projetos-grid');
  if (!container) return;

  if (!lista.length) {
    container.innerHTML = `
      <div style="grid-column:1/-1;">
        <div class="empty-state">
          <span class="empty-icon">🗂️</span>
          <p>Nenhum projeto encontrado</p>
        </div>
      </div>`;
    return;
  }

  const podeGerir = currentUser.role === 'Professor' || currentUser.role === 'Administrador';

  container.innerHTML = lista.map(proj => {
    const estadoConfig = {
      ativo:     { cor: 'var(--green)',       txt: '● Ativo' },
      pausado:   { cor: 'var(--orange)',      txt: '● Pausado' },
      concluido: { cor: 'var(--text-muted)',  txt: '● Concluído' },
    };
    const estado = estadoConfig[proj.estado] || estadoConfig.ativo;

    const dataInicio = new Date(proj.dataInicio).toLocaleDateString('pt-PT');
    const dataFim    = proj.dataFim ? new Date(proj.dataFim).toLocaleDateString('pt-PT') : '—';

    // Avatares dos membros
    const membrosHtml = proj.membros?.length
      ? proj.membros.slice(0, 4).map(m =>
          `<div title="${m.name}" style="width:28px;height:28px;background:linear-gradient(135deg,var(--green),var(--blue));border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--black);margin-right:-6px;border:2px solid var(--dark2);">${m.name.charAt(0).toUpperCase()}</div>`
        ).join('') + (proj.membros.length > 4 ? `<span style="font-size:11px;color:var(--text-muted);margin-left:10px;">+${proj.membros.length - 4}</span>` : '')
      : '<span style="font-size:12px;color:var(--text-muted);">Sem membros</span>';

    // Equipamentos
    const equipsHtml = proj.equipamentos?.length
      ? proj.equipamentos.slice(0, 3).map(e =>
          `<span class="kit-badge" style="font-size:10px;padding:2px 6px;">${e.kit}</span>`
        ).join(' ') + (proj.equipamentos.length > 3 ? `<span style="font-size:11px;color:var(--text-muted);"> +${proj.equipamentos.length - 3}</span>` : '')
      : '<span style="font-size:12px;color:var(--text-muted);">Sem equipamentos</span>';

    const btnEditar = podeGerir
      ? `<button onclick="abrirEditarProjeto('${proj._id}')" style="background:var(--dark3);border:1px solid var(--gray);color:var(--text-muted);padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;">✏️ Editar</button>
         <button onclick="apagarProjeto('${proj._id}','${proj.nome}')" style="background:rgba(224,23,110,0.1);border:1px solid rgba(224,23,110,0.3);color:var(--pink);padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer;">🗑️</button>`
      : '';

    return `
      <div style="background:var(--dark2);border:1px solid var(--gray);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:14px;transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--green)'" onmouseout="this.style.borderColor='var(--gray)'">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div>
            <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${proj.nome}</div>
            <div style="font-size:12px;color:var(--text-muted);">por ${proj.criadorId?.name || '—'}</div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${estado.cor};white-space:nowrap;">${estado.txt}</span>
        </div>

        <!-- Descrição -->
        ${proj.descricao ? `<div style="font-size:12px;color:var(--light);line-height:1.5;border-left:2px solid var(--gray);padding-left:10px;">${proj.descricao}</div>` : ''}

        <!-- Datas -->
        <div style="display:flex;gap:16px;">
          <div style="font-size:11px;color:var(--text-muted);">📅 Início: <strong style="color:var(--light);">${dataInicio}</strong></div>
          ${proj.dataFim ? `<div style="font-size:11px;color:var(--text-muted);">🏁 Fim: <strong style="color:var(--light);">${dataFim}</strong></div>` : ''}
        </div>

        <!-- Membros -->
        <div>
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">👥 Membros (${proj.membros?.length || 0})</div>
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">${membrosHtml}</div>
        </div>

        <!-- Equipamentos -->
        <div>
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📦 Equipamentos (${proj.equipamentos?.length || 0})</div>
          <div>${equipsHtml}</div>
        </div>

        <!-- Ações -->
        ${podeGerir ? `<div style="display:flex;gap:8px;padding-top:8px;border-top:1px solid var(--gray);">${btnEditar}</div>` : ''}
      </div>`;
  }).join('');
}

/* ── Filtrar ─────────────────────────────────────────── */
function filtrarProjetos(btn, estado) {
  document.querySelectorAll('#page-projetos .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtrados = estado === 'todos' ? todosProjetos : todosProjetos.filter(p => p.estado === estado);
  renderizarProjetos(filtrados);
}


/* ═══════════════════════════════════════════════════════
   MODAL — CRIAR / EDITAR PROJETO
═══════════════════════════════════════════════════════ */
function abrirNovoProjeto() {
  projetoEmEdicao = null;
  document.getElementById('proj-modal-titulo').textContent = 'Novo Projeto';
  document.getElementById('proj-nome').value      = '';
  document.getElementById('proj-descricao').value = '';
  document.getElementById('proj-estado').value    = 'ativo';
  document.getElementById('proj-data-fim').value  = '';
  document.getElementById('proj-erro').style.display = 'none';

  popularSelectsMembrosEquips();
  document.getElementById('proj-modal').classList.add('active');
}

async function abrirEditarProjeto(id) {
  const proj = todosProjetos.find(p => p._id === id);
  if (!proj) return;

  projetoEmEdicao = id;
  document.getElementById('proj-modal-titulo').textContent = 'Editar Projeto';
  document.getElementById('proj-nome').value      = proj.nome;
  document.getElementById('proj-descricao').value = proj.descricao || '';
  document.getElementById('proj-estado').value    = proj.estado;
  document.getElementById('proj-data-fim').value  = proj.dataFim ? proj.dataFim.split('T')[0] : '';
  document.getElementById('proj-erro').style.display = 'none';

  popularSelectsMembrosEquips(proj);
  document.getElementById('proj-modal').classList.add('active');
}

function popularSelectsMembrosEquips(proj) {
  // Membros — checkboxes
  const divMembros = document.getElementById('proj-membros-lista');
  const membrosIds = proj?.membros?.map(m => m._id || m) || [];

  if (divMembros && typeof todosUtilizadores !== 'undefined' && todosUtilizadores.length) {
    divMembros.innerHTML = todosUtilizadores.map(u => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;font-size:13px;min-width:0;">
        <input type="checkbox" value="${u._id}" ${membrosIds.includes(u._id) ? 'checked' : ''} style="accent-color:var(--green);flex-shrink:0;width:14px;height:14px;">
        <div style="width:24px;height:24px;background:linear-gradient(135deg,var(--green),var(--blue));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--black);flex-shrink:0;">${u.name.charAt(0).toUpperCase()}</div>
        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.name} <span style="color:var(--text-muted);font-size:11px;">(${u.role})</span></span>
      </label>`).join('');
  } else if (divMembros) {
    divMembros.innerHTML = '<div style="font-size:12px;color:var(--text-muted);">Sem utilizadores disponíveis</div>';
  }

  // Equipamentos — checkboxes
  const divEquips  = document.getElementById('proj-equips-lista');
  const equipsIds  = proj?.equipamentos?.map(e => e._id || e) || [];

  if (divEquips && todosEquipamentos.length) {
    divEquips.innerHTML = todosEquipamentos.map(e => `
      <label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;font-size:12px;min-width:0;">
        <input type="checkbox" value="${e._id}" ${equipsIds.includes(e._id) ? 'checked' : ''} style="accent-color:var(--green);flex-shrink:0;width:14px;height:14px;">
        <span class="kit-badge" style="font-size:10px;flex-shrink:0;">${e.kit}</span>
        <span style="color:var(--light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;" title="${e.descricao}">${e.descricao}</span>
      </label>`).join('');
  }
}

function fecharProjModal() {
  document.getElementById('proj-modal').classList.remove('active');
  projetoEmEdicao = null;
}

async function guardarProjeto() {
  const nome      = document.getElementById('proj-nome').value.trim();
  const descricao = document.getElementById('proj-descricao').value.trim();
  const estado    = document.getElementById('proj-estado').value;
  const dataFim   = document.getElementById('proj-data-fim').value;
  const err       = document.getElementById('proj-erro');
  const btn       = document.getElementById('proj-btn-guardar');

  // Membros selecionados
  const membros = [...document.querySelectorAll('#proj-membros-lista input:checked')].map(i => i.value);
  // Equipamentos selecionados
  const equipamentos = [...document.querySelectorAll('#proj-equips-lista input:checked')].map(i => i.value);

  if (!nome) {
    err.style.display = 'block';
    err.textContent   = 'O nome do projeto é obrigatório.';
    return;
  }

  btn.textContent = 'A guardar...';
  btn.disabled    = true;

  try {
    const corpo = { nome, descricao, estado, membros, equipamentos, dataFim: dataFim || null };
    const res   = projetoEmEdicao
      ? await apiFetch(`/api/projetos/${projetoEmEdicao}`, { method: 'PUT',  body: JSON.stringify(corpo) })
      : await apiFetch('/api/projetos',                    { method: 'POST', body: JSON.stringify(corpo) });

    if (!res) return;
    const data = await res.json();

    if (!res.ok) {
      err.style.display = 'block';
      err.textContent   = data.erro || 'Erro ao guardar.';
      return;
    }

    fecharProjModal();
    await carregarProjetos();
  } catch (e) {
    err.style.display = 'block';
    err.textContent   = 'Erro de ligação ao servidor.';
  } finally {
    btn.textContent = 'Guardar Projeto';
    btn.disabled    = false;
  }
}


/* ═══════════════════════════════════════════════════════
   APAGAR PROJETO
═══════════════════════════════════════════════════════ */
async function apagarProjeto(id, nome) {
  if (!confirm(`Tens a certeza que queres apagar o projeto "${nome}"?`)) return;
  try {
    const res  = await apiFetch(`/api/projetos/${id}`, { method: 'DELETE' });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { alert('Erro: ' + (data.erro || 'Não foi possível apagar.')); return; }
    await carregarProjetos();
  } catch (e) {
    alert('Erro de ligação ao servidor.');
  }
}