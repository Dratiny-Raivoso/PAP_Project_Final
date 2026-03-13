/* ═══════════════════════════════════════════════════════
   LED · js/app.js — Interface principal (versão MongoDB)
═══════════════════════════════════════════════════════ */

async function apiFetch(url, options = {}) {
  const token = obterToken();
  const res   = await fetch(url, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 401 || res.status === 403) { doLogout(); return null; }
  return res;
}

let todosEquipamentos = [];
let todasCategorias   = [];
let equipamentoEmEdicao = null;

const PAGE_CONFIG = {
  dashboard:  { title: 'Dashboard',             sub: 'Visão geral dos equipamentos' },
  todos:      { title: 'Todos os Equipamentos', sub: 'Lista completa' },
  multimedia: { title: 'Multimédia',             sub: 'Câmaras, áudio, impressão 3D e mais' },
  robotica:   { title: 'Programação & Robótica', sub: 'Arduino, Micro:bit, LEGO e sensores' },
  stem:       { title: 'STEM',                   sub: 'Mbot, robótica, energia renovável' },
  requisicoes: { title: 'Requisições',            sub: 'Gestão de empréstimos de equipamentos' },
  utilizadores:{ title: 'Gestão de Utilizadores',  sub: 'Contas e permissões' },
  projetos:    { title: 'Projetos',                 sub: 'Gestão de projetos e equipas' },
  perfil:      { title: 'Meu Perfil',               sub: 'Informações e definições da conta' },
};

async function showApp() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('main-app').classList.add('active');
  document.getElementById('sidebar-username').textContent = currentUser.name;
  document.getElementById('sidebar-userrole').textContent = currentUser.role || 'Utilizador';
  document.getElementById('user-avatar-text').textContent = currentUser.name.charAt(0).toUpperCase();

  // Mostrar/esconder botão "+ Adicionar" conforme o perfil
  const btnAdicionar = document.getElementById('btn-adicionar');
  if (btnAdicionar) btnAdicionar.style.display = currentUser.role === 'Administrador' ? 'inline-block' : 'none';
  await carregarCategorias();
  await carregarEquipamentos();
  await carregarRequisicoes();
  await carregarProjetos();

  // Só carregar utilizadores se for Administrador
  if (currentUser.role === 'Administrador' && typeof carregarUtilizadores === 'function') {
    await carregarUtilizadores();
    const badge = document.getElementById('users-badge');
    if (badge) badge.textContent = todosUtilizadores.length;
  } else {
    // Esconder o item de nav de utilizadores se não for admin
    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.getAttribute('onclick') === "showPage('utilizadores')") {
        n.style.display = 'none';
      }
    });
  }
}

async function carregarCategorias() {
  try {
    const res = await apiFetch('/api/equipamentos/categorias');
    if (!res) return;
    todasCategorias = await res.json();
    const select = document.getElementById('form-categoria');
    if (select) {
      select.innerHTML = '<option value="">Seleciona uma categoria</option>';
      todasCategorias.forEach(cat => {
        select.innerHTML += `<option value="${cat._id}">${cat.icone} ${cat.nome}</option>`;
      });
    }
  } catch (err) { console.error('Erro categorias:', err); }
}

async function carregarEquipamentos() {
  mostrarLoading(true);
  try {
    const res = await apiFetch('/api/equipamentos');
    if (!res) return;
    todosEquipamentos = await res.json();
    atualizarContadores();
    atualizarDashboard();
    renderizarTabela('all-table-body',  todosEquipamentos, true);
    renderizarTabela('mm-table-body',   filtrarPorCategoria('Multimédia'), false);
    renderizarTabela('rob-table-body',  filtrarPorCategoria('Prog. & Robótica'), false);
    renderizarTabela('stem-table-body', filtrarPorCategoria('STEM'), false);
  } catch (err) { console.error('Erro equipamentos:', err); }
  finally { mostrarLoading(false); }
}

function filtrarPorCategoria(nome) {
  return todosEquipamentos.filter(e => e.categoriaId && e.categoriaId.nome === nome);
}

function mostrarLoading(ativo) {
  if (!ativo) return;
  ['all-table-body','mm-table-body','rob-table-body','stem-table-body'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">A carregar...</td></tr>`;
  });
}

function atualizarContadores() {
  const mm   = filtrarPorCategoria('Multimédia').length;
  const rob  = filtrarPorCategoria('Prog. & Robótica').length;
  const stem = filtrarPorCategoria('STEM').length;
  const total = todosEquipamentos.length;
  document.getElementById('total-badge').textContent = total;
  document.getElementById('mm-badge').textContent    = mm;
  document.getElementById('rob-badge').textContent   = rob;
  document.getElementById('stem-badge').textContent  = stem;
  PAGE_CONFIG.todos.sub      = `Lista completa · ${total} itens`;
  PAGE_CONFIG.multimedia.sub = `Câmaras, áudio e mais · ${mm} itens`;
  PAGE_CONFIG.robotica.sub   = `Arduino, Micro:bit, LEGO · ${rob} itens`;
  PAGE_CONFIG.stem.sub       = `Mbot, robótica, energia · ${stem} itens`;
}

function atualizarDashboard() {
  const mm    = filtrarPorCategoria('Multimédia').length;
  const rob   = filtrarPorCategoria('Prog. & Robótica').length;
  const stem  = filtrarPorCategoria('STEM').length;
  const total = todosEquipamentos.length;

  // ── Stats de equipamentos ──
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-mm').textContent    = mm;
  document.getElementById('stat-rob').textContent   = rob;
  document.getElementById('stat-stem').textContent  = stem;

  // ── Barras de distribuição ──
  setTimeout(() => {
    document.getElementById('bar-mm').style.width   = total ? (mm/total*100)+'%' : '0%';
    document.getElementById('bar-rob').style.width  = total ? (rob/total*100)+'%' : '0%';
    document.getElementById('bar-stem').style.width = total ? (stem/total*100)+'%' : '0%';
  }, 150);
  document.getElementById('count-mm').textContent   = mm;
  document.getElementById('count-rob').textContent  = rob;
  document.getElementById('count-stem').textContent = stem;

  // ── Stats de disponibilidade ──
  const disponiveis  = todosEquipamentos.filter(e => e.estado === 'disponivel').length;
  const requisitados = todosEquipamentos.filter(e => e.estado === 'requisitado').length;
  const manutencao   = todosEquipamentos.filter(e => e.estado === 'em_manutencao').length;
  const danificados  = todosEquipamentos.filter(e => e.estado === 'danificado').length;

  const elDisp = document.getElementById('stat-disponiveis');
  const elReq  = document.getElementById('stat-requisitados');
  const elMant = document.getElementById('stat-manutencao');
  const elDan  = document.getElementById('stat-danificados');
  if (elDisp) elDisp.textContent = disponiveis;
  if (elReq)  elReq.textContent  = requisitados;
  if (elMant) elMant.textContent = manutencao;
  if (elDan)  elDan.textContent  = danificados;

  // ── Stats de requisições ──
  const ativas    = todasRequisicoes.filter(r => r.estado === 'ativa').length;
  const atrasadas = todasRequisicoes.filter(r => r.estado === 'atrasada').length;
  const elAtivas    = document.getElementById('dash-req-ativas');
  const elAtrasadas = document.getElementById('dash-req-atrasadas');
  if (elAtivas)    elAtivas.textContent    = ativas;
  if (elAtrasadas) elAtrasadas.textContent = atrasadas;

  // ── Requisições ativas recentes ──
  const reqRecentes = todasRequisicoes
    .filter(r => r.estado === 'ativa' || r.estado === 'atrasada')
    .slice(0, 5);

  const elReqRecentes = document.getElementById('dash-req-recentes');
  if (elReqRecentes) {
    if (!reqRecentes.length) {
      elReqRecentes.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0;">Nenhuma requisição ativa</div>';
    } else {
      elReqRecentes.innerHTML = reqRecentes.map(req => {
        const cor      = req.estado === 'atrasada' ? 'var(--pink)' : 'var(--orange)';
        const dataDevol = new Date(req.dataDevolucaoPrevista).toLocaleDateString('pt-PT');
        const hoje      = new Date();
        const prevista  = new Date(req.dataDevolucaoPrevista);
        const dias      = Math.ceil((prevista - hoje) / (1000*60*60*24));
        const diasTxt   = dias < 0 ? `<span style="color:var(--pink);font-size:10px;font-weight:700;">${Math.abs(dias)}d atraso</span>`
                        : dias <= 2 ? `<span style="color:var(--orange);font-size:10px;font-weight:700;">${dias}d restantes</span>`
                        : `<span style="color:var(--text-muted);font-size:10px;">${dataDevol}</span>`;
        return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px;background:var(--dark2);border-radius:8px;">
          <span class="kit-badge">${req.equipamentoId?.kit || '—'}</span>
          <div style="flex:1;overflow:hidden;">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${req.userId?.name || '—'}</div>
            <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${req.equipamentoId?.descricao || '—'}</div>
          </div>
          ${diasTxt}
        </div>`;
      }).join('');
    }
  }

  // ── Equipamentos recentes ──
  document.getElementById('recent-items').innerHTML = todosEquipamentos.slice(0,6).map(item => {
    const estadoCor = item.estado === 'disponivel' ? 'var(--green)' : item.estado === 'requisitado' ? 'var(--orange)' : 'var(--pink)';
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span class="kit-badge">${item.kit}</span>
      <span style="font-size:12px;color:var(--light);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${item.descricao}">${item.descricao}</span>
      <span style="font-size:10px;font-weight:700;color:${estadoCor}">●</span>
    </div>`;
  }).join('');
}

function formatarEstado(estado) {
  return { disponivel:'● Disponível', requisitado:'● Requisitado', em_manutencao:'● Em Manutenção', danificado:'● Danificado' }[estado] || estado;
}

function renderizarTabela(tbodyId, itens, mostrarCat) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!itens.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><span class="empty-icon">📭</span><p>Sem equipamentos para mostrar</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = itens.map(item => {
    const catNome  = item.categoriaId?.nome || '';
    const catClass = catNome === 'Multimédia' ? 'cat-multimedia' : catNome.includes('Rob') ? 'cat-robotica' : 'cat-stem';
    const catCell  = mostrarCat ? `<td><span class="cat-tag ${catClass}">${catNome}</span></td>` : '';
    const estadoCor = item.estado === 'disponivel' ? 'var(--green)' : item.estado === 'requisitado' ? 'var(--orange)' : item.estado === 'em_manutencao' ? 'var(--blue)' : 'var(--pink)';
    const isAdmin   = currentUser && currentUser.role === 'Administrador';
    const btnEditar = isAdmin ? `<button onclick="abrirEditar('${item._id}')" style="background:var(--dark3);border:1px solid var(--gray);color:var(--text-muted);padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;">✏️</button>` : '';
    const btnApagar = isAdmin ? `<button onclick="confirmarApagar('${item._id}','${item.kit}')" style="background:rgba(224,23,110,0.1);border:1px solid rgba(224,23,110,0.3);color:var(--pink);padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;">🗑️</button>` : '';
    return `<tr>
      <td><span class="kit-badge">${item.kit}</span></td>
      <td>${item.descricao}</td>
      <td><span class="qty-badge">${item.quantidade}</span></td>
      ${catCell}
      <td>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:11px;font-weight:600;color:${estadoCor}">${formatarEstado(item.estado)}</span>
          ${btnEditar}
          ${btnApagar}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function abrirAdicionar() {
  equipamentoEmEdicao = null;
  document.getElementById('form-modal-titulo').textContent = 'Adicionar Equipamento';
  ['form-kit','form-descricao','form-localizacao','form-marca','form-modelo','form-notas'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('form-quantidade').value = '1';
  document.getElementById('form-categoria').value  = '';
  document.getElementById('form-estado').value     = 'disponivel';
  document.getElementById('form-erro').style.display = 'none';
  document.getElementById('form-modal').classList.add('active');
}

async function abrirEditar(id) {
  const item = todosEquipamentos.find(e => e._id === id);
  if (!item) return;
  equipamentoEmEdicao = id;
  document.getElementById('form-modal-titulo').textContent = 'Editar Equipamento';
  document.getElementById('form-kit').value         = item.kit;
  document.getElementById('form-descricao').value   = item.descricao;
  document.getElementById('form-categoria').value   = item.categoriaId?._id || '';
  document.getElementById('form-quantidade').value  = item.quantidade;
  document.getElementById('form-localizacao').value = item.localizacao || '';
  document.getElementById('form-marca').value       = item.marca  || '';
  document.getElementById('form-modelo').value      = item.modelo || '';
  document.getElementById('form-notas').value       = item.notas  || '';
  document.getElementById('form-estado').value      = item.estado || 'disponivel';
  document.getElementById('form-erro').style.display = 'none';
  document.getElementById('form-modal').classList.add('active');
}

function fecharFormModal() {
  document.getElementById('form-modal').classList.remove('active');
  equipamentoEmEdicao = null;
}

async function guardarEquipamento() {
  const kit         = document.getElementById('form-kit').value.trim();
  const descricao   = document.getElementById('form-descricao').value.trim();
  const categoriaId = document.getElementById('form-categoria').value;
  const quantidade  = parseInt(document.getElementById('form-quantidade').value) || 1;
  const localizacao = document.getElementById('form-localizacao').value.trim();
  const marca       = document.getElementById('form-marca').value.trim();
  const modelo      = document.getElementById('form-modelo').value.trim();
  const notas       = document.getElementById('form-notas').value.trim();
  const estado      = document.getElementById('form-estado').value;
  const err         = document.getElementById('form-erro');
  const btn         = document.getElementById('form-btn-guardar');

  if (!kit || !descricao || !categoriaId) {
    err.style.display = 'block';
    err.textContent   = 'Código kit, descrição e categoria são obrigatórios.';
    return;
  }

  btn.textContent = 'A guardar...';
  btn.disabled    = true;

  try {
    const corpo = { kit, descricao, categoriaId, quantidade, localizacao, marca, modelo, notas, estado };
    const res   = equipamentoEmEdicao
      ? await apiFetch(`/api/equipamentos/${equipamentoEmEdicao}`, { method: 'PUT',  body: JSON.stringify(corpo) })
      : await apiFetch('/api/equipamentos',                         { method: 'POST', body: JSON.stringify(corpo) });

    if (!res) return;
    const data = await res.json();
    if (!res.ok) { err.style.display = 'block'; err.textContent = data.erro || 'Erro ao guardar.'; return; }
    fecharFormModal();
    await carregarEquipamentos();
  } catch (e) {
    err.style.display = 'block';
    err.textContent   = 'Erro de ligação ao servidor.';
  } finally {
    btn.textContent = 'Guardar';
    btn.disabled    = false;
  }
}

async function confirmarApagar(id, kit) {
  if (!confirm(`Tens a certeza que queres apagar "${kit}"?`)) return;
  try {
    const res  = await apiFetch(`/api/equipamentos/${id}`, { method: 'DELETE' });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { alert('Erro: ' + (data.erro || 'Não foi possível apagar.')); return; }
    await carregarEquipamentos();
  } catch (e) { alert('Erro de ligação ao servidor.'); }
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p  => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick') === `showPage('${page}')`) n.classList.add('active');
  });
  const cfg = PAGE_CONFIG[page];
  if (cfg) {
    document.getElementById('topbar-title').textContent = cfg.title;
    document.getElementById('topbar-sub').textContent   = cfg.sub;
  }
  document.getElementById('search-input').value = '';
  if (page === 'requisicoes') carregarRequisicoes();
  if (page === 'utilizadores' && currentUser.role === 'Administrador') carregarUtilizadores();
  if (page === 'projetos') carregarProjetos();
  if (page === 'perfil') carregarPerfil();
}

function doSearch() {
  const q      = document.getElementById('search-input').value.toLowerCase().trim();
  const pageId = document.querySelector('.page.active')?.id.replace('page-','');
  let itens, mostrarCat = false, tbodyId;
  switch (pageId) {
    case 'todos':      itens = todosEquipamentos;                    mostrarCat = true; tbodyId = 'all-table-body'; break;
    case 'multimedia': itens = filtrarPorCategoria('Multimédia');                       tbodyId = 'mm-table-body';  break;
    case 'robotica':   itens = filtrarPorCategoria('Prog. & Robótica');                 tbodyId = 'rob-table-body'; break;
    case 'stem':       itens = filtrarPorCategoria('STEM');                             tbodyId = 'stem-table-body'; break;
    default: return;
  }
  const filtrados = q ? itens.filter(i => i.descricao.toLowerCase().includes(q) || i.kit.toLowerCase().includes(q)) : itens;
  renderizarTabela(tbodyId, filtrados, mostrarCat);
}

function filterAll(btn, cat) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const itens = cat === 'all' ? todosEquipamentos : todosEquipamentos.filter(i => i.categoriaId?.nome === cat);
  renderizarTabela('all-table-body', itens, true);
}