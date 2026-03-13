/* ═══════════════════════════════════════════════════════
   LED · js/perfil.js
   Página de perfil do utilizador
═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   CARREGAR DADOS DO PERFIL
═══════════════════════════════════════════════════════ */
async function carregarPerfil() {
  try {
    const res = await apiFetch('/api/auth/perfil');
    if (!res) return;
    const user = await res.json();

    document.getElementById('perfil-avatar').textContent   = user.name.charAt(0).toUpperCase();
    document.getElementById('perfil-nome-display').textContent  = user.name;
    document.getElementById('perfil-email-display').textContent = user.email;
    document.getElementById('perfil-role-display').textContent  = user.role || 'Utilizador';
    document.getElementById('perfil-since').textContent = new Date(user.createdAt).toLocaleDateString('pt-PT', { day:'2-digit', month:'long', year:'numeric' });

    document.getElementById('perfil-nome').value  = user.name;
    document.getElementById('perfil-email').value = user.email;

    // Stats do utilizador
    const minhasReqs    = todasRequisicoes.filter(r => r.userId?._id === user._id || r.userId?.email === user.email);
    const ativas        = minhasReqs.filter(r => r.estado === 'ativa').length;
    const devolvidas    = minhasReqs.filter(r => r.estado === 'devolvida').length;

    const elAtivas     = document.getElementById('perfil-stat-ativas');
    const elDevolvidas = document.getElementById('perfil-stat-devolvidas');
    const elTotal      = document.getElementById('perfil-stat-total');
    if (elAtivas)     elAtivas.textContent     = ativas;
    if (elDevolvidas) elDevolvidas.textContent = devolvidas;
    if (elTotal)      elTotal.textContent      = minhasReqs.length;

  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
  }
}


/* ═══════════════════════════════════════════════════════
   GUARDAR ALTERAÇÕES DO PERFIL
═══════════════════════════════════════════════════════ */
async function guardarPerfil() {
  const name         = document.getElementById('perfil-nome').value.trim();
  const passwordAtual = document.getElementById('perfil-pw-atual').value;
  const passwordNova  = document.getElementById('perfil-pw-nova').value;
  const passwordConf  = document.getElementById('perfil-pw-conf').value;
  const err           = document.getElementById('perfil-erro');
  const suc           = document.getElementById('perfil-sucesso');
  const btn           = document.getElementById('perfil-btn-guardar');

  err.style.display = 'none';
  suc.style.display = 'none';

  if (!name) {
    err.style.display = 'block';
    err.textContent   = 'O nome não pode estar vazio.';
    return;
  }

  // Validar passwords se preenchidas
  if (passwordNova || passwordAtual) {
    if (!passwordAtual) {
      err.style.display = 'block';
      err.textContent   = 'Introduz a password atual.';
      return;
    }
    if (!passwordNova) {
      err.style.display = 'block';
      err.textContent   = 'Introduz a nova password.';
      return;
    }
    if (passwordNova.length < 6) {
      err.style.display = 'block';
      err.textContent   = 'A nova password deve ter pelo menos 6 caracteres.';
      return;
    }
    if (passwordNova !== passwordConf) {
      err.style.display = 'block';
      err.textContent   = 'As passwords não coincidem.';
      return;
    }
  }

  btn.textContent = 'A guardar...';
  btn.disabled    = true;

  try {
    const corpo = { name };
    if (passwordNova) {
      corpo.passwordAtual = passwordAtual;
      corpo.passwordNova  = passwordNova;
    }

    const res  = await apiFetch('/api/auth/perfil', {
      method: 'PUT',
      body:   JSON.stringify(corpo),
    });
    if (!res) return;

    const data = await res.json();
    if (!res.ok) {
      err.style.display = 'block';
      err.textContent   = data.erro || 'Erro ao guardar.';
      return;
    }

    // Atualizar currentUser e UI
    currentUser.name = data.name;
    document.getElementById('sidebar-username').textContent  = data.name;
    document.getElementById('user-avatar-text').textContent  = data.name.charAt(0).toUpperCase();
    document.getElementById('perfil-avatar').textContent     = data.name.charAt(0).toUpperCase();
    document.getElementById('perfil-nome-display').textContent = data.name;

    // Limpar campos de password
    document.getElementById('perfil-pw-atual').value = '';
    document.getElementById('perfil-pw-nova').value  = '';
    document.getElementById('perfil-pw-conf').value  = '';

    suc.style.display = 'block';
    suc.textContent   = '✅ Perfil atualizado com sucesso!';
    setTimeout(() => suc.style.display = 'none', 3000);

  } catch (e) {
    err.style.display = 'block';
    err.textContent   = 'Erro de ligação ao servidor.';
  } finally {
    btn.textContent = 'Guardar Alterações';
    btn.disabled    = false;
  }
}