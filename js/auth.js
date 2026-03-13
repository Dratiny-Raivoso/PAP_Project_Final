/* ═══════════════════════════════════════════════════════
   LED · js/auth.js — Autenticação (versão MongoDB)
   Comunica com a API Node.js via fetch()
═══════════════════════════════════════════════════════ */

let currentUser = null;

/* ═══════════════════════════════════════════════════════
   HELPERS — Token JWT
═══════════════════════════════════════════════════════ */
function guardarToken(token) {
  sessionStorage.setItem('led_token', token);
}

function obterToken() {
  return sessionStorage.getItem('led_token');
}

function removerToken() {
  sessionStorage.removeItem('led_token');
}

/* ── Verificar se já há sessão iniciada ao carregar a página ── */
window.addEventListener('load', async () => {
  const token = obterToken();
  if (!token) return;

  try {
    const res = await fetch('/api/auth/perfil', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const user  = await res.json();
      currentUser = user;
      showApp();
    } else {
      removerToken();
    }
  } catch (err) {
    removerToken();
  }
});


/* ═══════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════ */
async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;
  const err      = document.getElementById('login-error');
  const btn      = document.querySelector('#login-page .btn-primary');

  if (!email || !password) {
    err.style.display = 'block';
    err.textContent   = 'Preenche o email e a password.';
    return;
  }

  btn.textContent = 'A entrar...';
  btn.disabled    = true;

  try {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      err.style.display = 'block';
      err.textContent   = data.erro || 'Erro ao fazer login.';
      return;
    }

    guardarToken(data.token);
    currentUser       = data.user;
    err.style.display = 'none';
    showApp();

  } catch (e) {
    err.style.display = 'block';
    err.textContent   = 'Não foi possível ligar ao servidor. Verifica se o servidor está a correr.';
  } finally {
    btn.textContent = 'Entrar';
    btn.disabled    = false;
  }
}


/* ═══════════════════════════════════════════════════════
   REGISTO
═══════════════════════════════════════════════════════ */
async function doRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-pass').value;
  const role     = document.getElementById('reg-role').value.trim() || 'Utilizador';
  const err      = document.getElementById('reg-error');
  const btn      = document.querySelector('#register-modal .btn-primary');

  if (!name || !email || !password) {
    err.style.display = 'block';
    err.textContent   = 'Preenche todos os campos obrigatórios.';
    return;
  }
  if (password.length < 6) {
    err.style.display = 'block';
    err.textContent   = 'A password deve ter mínimo 6 caracteres.';
    return;
  }

  btn.textContent = 'A criar conta...';
  btn.disabled    = true;

  try {
    const res  = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (!res.ok) {
      err.style.display = 'block';
      err.textContent   = data.erro || 'Erro ao criar conta.';
      return;
    }

    err.style.display = 'none';
    closeRegisterModal();
    document.getElementById('login-email').value = email;
    document.getElementById('login-pass').value  = '';
    alert('✅ Conta criada com sucesso! Faz login para entrar.');

  } catch (e) {
    err.style.display = 'block';
    err.textContent   = 'Não foi possível ligar ao servidor.';
  } finally {
    btn.textContent = 'Criar conta';
    btn.disabled    = false;
  }
}


/* ═══════════════════════════════════════════════════════
   LOGOUT
═══════════════════════════════════════════════════════ */
function doLogout() {
  removerToken();
  currentUser = null;
  document.getElementById('main-app').classList.remove('active');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
}


/* ═══════════════════════════════════════════════════════
   MODAL DE REGISTO
═══════════════════════════════════════════════════════ */
function showRegisterModal() {
  document.getElementById('reg-name').value  = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-pass').value  = '';
  document.getElementById('reg-role').value  = '';
  document.getElementById('reg-error').style.display = 'none';
  document.getElementById('register-modal').classList.add('active');
}

function closeRegisterModal() {
  document.getElementById('register-modal').classList.remove('active');
}

/* ── Enter no formulário de login ────────────────────── */
document.addEventListener('keydown', e => {
  const loginPage = document.getElementById('login-page');
  if (e.key === 'Enter' && loginPage.style.display !== 'none') {
    doLogin();
  }
});