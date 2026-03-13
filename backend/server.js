/* ═══════════════════════════════════════════════════════
   LED · backend/server.js
   Servidor principal — Node.js + Express + MongoDB
═══════════════════════════════════════════════════════ */

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const app = express();

/* ── Middlewares ─────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

/* ── Rotas da API ────────────────────────────────────── */
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/equipamentos', require('./routes/equipamentos'));
app.use('/api/requisicoes',  require('./routes/requisicoes'));
app.use('/api/projetos',      require('./routes/projetos'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* ── Ligar ao MongoDB e arrancar ─────────────────────── */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB ligado com sucesso!');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Servidor a correr em http://localhost:${process.env.PORT || 3000}`);
    });
  })
  .catch(err => {
    console.error('❌ Erro ao ligar ao MongoDB:', err.message);
    process.exit(1);
  });