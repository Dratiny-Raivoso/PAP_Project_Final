/* ═══════════════════════════════════════════════════════
   LED · backend/routes/projetos.js
   Rotas de projetos — listar, criar, editar, apagar
═══════════════════════════════════════════════════════ */

const express  = require('express');
const Projeto  = require('../models/Projeto');
const { verificarToken } = require('./auth');
const router   = express.Router();

// Middleware: só Professores e Admins podem criar/editar/apagar
function verificarProfessorOuAdmin(req, res, next) {
  if (req.user.role !== 'Professor' && req.user.role !== 'Administrador') {
    return res.status(403).json({ erro: 'Só Professores e Administradores podem gerir projetos.' });
  }
  next();
}


/* ═══════════════════════════════════════════════════════
   GET /api/projetos — listar todos
═══════════════════════════════════════════════════════ */
router.get('/', verificarToken, async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;

    const projetos = await Projeto.find(filtro)
      .populate('criadorId',    'name email role')
      .populate('membros',      'name email role')
      .populate('equipamentos', 'kit descricao estado')
      .sort({ createdAt: -1 });

    res.json(projetos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   GET /api/projetos/stats
═══════════════════════════════════════════════════════ */
router.get('/stats', verificarToken, async (req, res) => {
  try {
    const ativos     = await Projeto.countDocuments({ estado: 'ativo' });
    const pausados   = await Projeto.countDocuments({ estado: 'pausado' });
    const concluidos = await Projeto.countDocuments({ estado: 'concluido' });
    res.json({ ativos, pausados, concluidos, total: ativos + pausados + concluidos });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   GET /api/projetos/:id — ver um projeto
═══════════════════════════════════════════════════════ */
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const projeto = await Projeto.findById(req.params.id)
      .populate('criadorId',    'name email role')
      .populate('membros',      'name email role')
      .populate('equipamentos', 'kit descricao estado categoriaId');

    if (!projeto) return res.status(404).json({ erro: 'Projeto não encontrado.' });
    res.json(projeto);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   POST /api/projetos — criar novo projeto
═══════════════════════════════════════════════════════ */
router.post('/', verificarToken, verificarProfessorOuAdmin, async (req, res) => {
  const { nome, descricao, estado, membros, equipamentos, dataFim } = req.body;

  if (!nome) return res.status(400).json({ erro: 'O nome do projeto é obrigatório.' });

  try {
    const novo = await Projeto.create({
      nome,
      descricao,
      estado:      estado || 'ativo',
      criadorId:   req.user.id,
      membros:     membros     || [],
      equipamentos:equipamentos || [],
      dataFim:     dataFim     || null,
    });

    const resultado = await Projeto.findById(novo._id)
      .populate('criadorId',    'name email')
      .populate('membros',      'name email')
      .populate('equipamentos', 'kit descricao');

    res.status(201).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   PUT /api/projetos/:id — editar projeto
═══════════════════════════════════════════════════════ */
router.put('/:id', verificarToken, verificarProfessorOuAdmin, async (req, res) => {
  try {
    const atualizado = await Projeto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('criadorId',    'name email')
      .populate('membros',      'name email')
      .populate('equipamentos', 'kit descricao');

    if (!atualizado) return res.status(404).json({ erro: 'Projeto não encontrado.' });
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   DELETE /api/projetos/:id — apagar projeto
═══════════════════════════════════════════════════════ */
router.delete('/:id', verificarToken, verificarProfessorOuAdmin, async (req, res) => {
  try {
    const apagado = await Projeto.findByIdAndDelete(req.params.id);
    if (!apagado) return res.status(404).json({ erro: 'Projeto não encontrado.' });
    res.json({ mensagem: 'Projeto apagado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


module.exports = router;