# LED · Laboratórios de Educação Digital
## Gestão de Equipamentos — Estrutura do Projeto

```
led_project/
│
├── index.html              ← Ponto de entrada (login + app)
│
├── css/
│   ├── style.css           ← Variáveis, reset, componentes partilhados
│   ├── login.css           ← Estilos exclusivos da página de login
│   └── app.css             ← Estilos do dashboard, sidebar, modal, topbar
│
└── js/
    ├── data.js             ← Dados dos equipamentos (fonte: Excel)
    ├── auth.js             ← Login, registo, logout
    └── app.js              ← Dashboard, navegação, tabelas, pesquisa
```

---

## Como abrir
Abre o ficheiro `index.html` diretamente no browser.

**Conta demo:**
- Email: `demo@led.pt`
- Password: `demo123`

---

## Integração futura — MongoDB + Node.js

### O que mudar em `auth.js`
```js
// ANTES (localStorage)
function getUsers() {
  return JSON.parse(localStorage.getItem('led_users') || '[]');
}

// DEPOIS (API Node.js)
async function doLogin() {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) { /* guardar token e mostrar app */ }
}
```

### O que mudar em `data.js`
```js
// ANTES (dados estáticos)
const DATA = { multimedia: [...], robotica: [...], stem: [...] };

// DEPOIS (API Node.js)
async function loadData() {
  const res = await fetch('/api/equipamentos');
  const DATA = await res.json();
  showApp();
}
```

### Stack sugerida para o backend
- **Node.js** + **Express** — servidor REST
- **MongoDB** + **Mongoose** — base de dados
- **JWT** — autenticação via token
- **bcrypt** — hash de passwords
