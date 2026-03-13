/* ═══════════════════════════════════════════════════════
   LED · js/utilizadores.js
   Lógica da página de gestão de utilizadores
═══════════════════════════════════════════════════════ */

let todosUtilizadores = [];

/* ═══════════════════════════════════════════════════════
   CARREGAR UTILIZADORES DA API
═══════════════════════════════════════════════════════ */
async function carregarUtilizadores() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">A carregar...</td></tr>`;

  try {
    const res = await apiFetch('/api/auth/utilizadores');
    if (!res) return;

    if (res.status === 403) {
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state">
            <span class="empty-icon">🔒</span>
            <p>Só os Administradores podem ver esta página.</p>
          </div>
        </td></tr>`;
      return;
    }

    todosUtilizadores = await res.json();
    renderizarUtilizadores(todosUtilizadores);
    atualizarStatsUtilizadores();

  } catch (err) {
    console.error('Erro ao carregar utilizadores:', err);
  }
}

/* ── Stats ───────────────────────────────────────────── */
function atualizarStatsUtilizadores() {
  const total    = todosUtilizadores.length;
  const ativos   = todosUtilizadores.filter(u => u.ativo).length;
  const inativos = todosUtilizadores.filter(u => !u.ativo).length;
  const admins   = todosUtilizadores.filter(u => u.role === 'Administrador').length;

  const elTotal    = document.getElementById('users-stat-total');
  const elAtivos   = document.getElementById('users-stat-ativos');
  const elInativos = document.getElementById('users-stat-inativos');
  const elAdmins   = document.getElementById('users-stat-admins');

  if (elTotal)    elTotal.textContent    = total;
  if (elAtivos)   elAtivos.textContent   = ativos;
  if (elInativos) elInativos.textContent = inativos;
  if (elAdmins)   elAdmins.textContent   = admins;
}


/* ═══════════════════════════════════════════════════════
   RENDERIZAR TABELA DE UTILIZADORES
═══════════════════════════════════════════════════════ */
function renderizarUtilizadores(lista) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <span class="empty-icon">👥</span>
          <p>Nenhum utilizador encontrado</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(user => {
    const isCurrentUser = user._id === currentUser.id || user.email === currentUser.email;

    // Badge do perfil
    const roleColors = {
      'Administrador': 'background:rgba(240,133,27,0.15);color:var(--orange)',
      'Professor':     'background:rgba(77,184,75,0.15);color:var(--green)',
      'Técnico':       'background:rgba(59,181,232,0.15);color:var(--blue)',
      'Utilizador':    'background:rgba(255,255,255,0.08);color:var(--text-muted)',
    };
    const roleStyle = roleColors[user.role] || roleColors['Utilizador'];

    // Estado ativo/inativo
    const estadoStyle = user.ativo
      ? 'color:var(--green); font-weight:600;'
      : 'color:var(--pink); font-weight:600;';
    const estadoTexto = user.ativo ? '● Ativo' : '● Inativo';

    // Data de criação
    const dataCriacao = new Date(user.createdAt).toLocaleDateString('pt-PT');
    const lastLogin   = user.lastLogin
      ? new Date(user.lastLogin).toLocaleDateString('pt-PT')
      : 'Nunca';

    // Botões — não mostrar opção de apagar na própria conta
    const btnToggle = isCurrentUser ? '' : `
      <button onclick="toggleAtivo('${user._id}', ${user.ativo})"
        style="background:${user.ativo ? 'rgba(224,23,110,0.1)' : 'rgba(77,184,75,0.1)'};
               border:1px solid ${user.ativo ? 'rgba(224,23,110,0.3)' : 'rgba(77,184,75,0.3)'};
               color:${user.ativo ? 'var(--pink)' : 'var(--green)'};
               padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;font-weight:600;">
        ${user.ativo ? '🚫 Desativar' : '✅ Ativar'}
      </button>`;

    const btnApagar = isCurrentUser ? '' : `
      <button onclick="apagarUtilizador('${user._id}', '${user.name}')"
        style="background:rgba(224,23,110,0.1);border:1px solid rgba(224,23,110,0.3);
               color:var(--pink);padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;">
        🗑️
      </button>`;

    const tuLabel = isCurrentUser
      ? '<span style="font-size:10px;background:rgba(77,184,75,0.15);color:var(--green);padding:2px 6px;border-radius:4px;margin-left:6px;">tu</span>'
      : '';

    return `
      <tr style="${!user.ativo ? 'opacity:0.6;' : ''}">
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;background:linear-gradient(135deg,var(--green),var(--blue));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--black);flex-shrink:0;">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;">${user.name}${tuLabel}</div>
              <div style="font-size:11px;color:var(--text-muted);">${user.email}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;${roleStyle}">${user.role}</span>
        </td>
        <td style="font-size:12px;color:var(--text-muted);">${dataCriacao}</td>
        <td style="font-size:12px;color:var(--text-muted);">${lastLogin}</td>
        <td><span style="font-size:12px;${estadoStyle}">${estadoTexto}</span></td>
        <td>
          <div style="display:flex;gap:6px;align-items:center;">
            <button onclick="abrirEditarUser('${user._id}')"
              style="background:var(--dark3);border:1px solid var(--gray);color:var(--text-muted);padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;">
              ✏️ Editar
            </button>
            ${btnToggle}
            ${btnApagar}
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ── Filtrar utilizadores ────────────────────────────── */
function filtrarUtilizadores(btn, filtro) {
  document.querySelectorAll('#page-utilizadores .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const filtrados = filtro === 'todos'     ? todosUtilizadores
    : filtro === 'ativos'                  ? todosUtilizadores.filter(u => u.ativo)
    : filtro === 'inativos'                ? todosUtilizadores.filter(u => !u.ativo)
    : todosUtilizadores.filter(u => u.role === filtro);

  renderizarUtilizadores(filtrados);
}


/* ═══════════════════════════════════════════════════════
   MODAL — EDITAR UTILIZADOR
═══════════════════════════════════════════════════════ */
function abrirEditarUser(id) {
  const user = todosUtilizadores.find(u => u._id === id);
  if (!user) return;

  document.getElementById('user-edit-id').value    = user._id;
  document.getElementById('user-edit-name').value  = user.name;
  document.getElementById('user-edit-email').value = user.email;
  document.getElementById('user-edit-role').value  = user.role;
  document.getElementById('user-edit-erro').style.display = 'none';
  document.getElementById('user-edit-modal').classList.add('active');
}

function fecharUserModal() {
  document.getElementById('user-edit-modal').classList.remove('active');
}

async function guardarUtilizador() {
  const id   = document.getElementById('user-edit-id').value;
  const name = document.getElementById('user-edit-name').value.trim();
  const role = document.getElementById('user-edit-role').value;
  const err  = document.getElementById('user-edit-erro');
  const btn  = document.getElementById('user-edit-btn');

  if (!name) {
    err.style.display = 'block';
    err.textContent   = 'O nome é obrigatório.';
    return;
  }

  btn.textContent = 'A guardar...';
  btn.disabled    = true;

  try {
    const res  = await apiFetch(`/api/auth/utilizadores/${id}`, {
      method: 'PUT',
      body:   JSON.stringify({ name, role }),
    });
    if (!res) return;

    const data = await res.json();
    if (!res.ok) {
      err.style.display = 'block';
      err.textContent   = data.erro || 'Erro ao guardar.';
      return;
    }

    fecharUserModal();
    await carregarUtilizadores();

  } catch (e) {
    err.style.display = 'block';
    err.textContent   = 'Erro de ligação ao servidor.';
  } finally {
    btn.textContent = 'Guardar';
    btn.disabled    = false;
  }
}


/* ═══════════════════════════════════════════════════════
   ATIVAR / DESATIVAR CONTA
═══════════════════════════════════════════════════════ */
async function toggleAtivo(id, ativoAtual) {
  const acao = ativoAtual ? 'desativar' : 'ativar';
  if (!confirm(`Tens a certeza que queres ${acao} esta conta?`)) return;

  try {
    const res  = await apiFetch(`/api/auth/utilizadores/${id}`, {
      method: 'PUT',
      body:   JSON.stringify({ ativo: !ativoAtual }),
    });
    if (!res) return;

    const data = await res.json();
    if (!res.ok) { alert('Erro: ' + (data.erro || 'Não foi possível alterar.')); return; }

    await carregarUtilizadores();
  } catch (e) {
    alert('Erro de ligação ao servidor.');
  }
}


/* ═══════════════════════════════════════════════════════
   APAGAR CONTA
═══════════════════════════════════════════════════════ */
async function apagarUtilizador(id, nome) {
  if (!confirm(`Tens a certeza que queres apagar a conta de "${nome}"?\nEsta ação não pode ser desfeita.`)) return;

  try {
    const res  = await apiFetch(`/api/auth/utilizadores/${id}`, { method: 'DELETE' });
    if (!res) return;

    const data = await res.json();
    if (!res.ok) { alert('Erro: ' + (data.erro || 'Não foi possível apagar.')); return; }

    await carregarUtilizadores();
  } catch (e) {
    alert('Erro de ligação ao servidor.');
  }
}