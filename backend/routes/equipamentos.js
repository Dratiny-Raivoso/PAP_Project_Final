/* ═══════════════════════════════════════════════════════
   LED · backend/routes/equipamentos.js
   Rotas de equipamentos — listar, criar, editar, apagar
═══════════════════════════════════════════════════════ */

const express     = require('express');
const Equipamento = require('../models/Equipamento');
const Categoria   = require('../models/Categoria');
const { verificarToken } = require('./auth');
const router      = express.Router();

/* GET /api/equipamentos — listar todos */
router.get('/', verificarToken, async (req, res) => {
  try {
    const { categoria, estado, pesquisa } = req.query;
    const filtro = {};
    if (categoria) filtro.categoriaId = categoria;
    if (estado)    filtro.estado      = estado;
    if (pesquisa)  filtro.descricao   = { $regex: pesquisa, $options: 'i' };

    const equipamentos = await Equipamento.find(filtro)
      .populate('categoriaId', 'nome icone cor')
      .sort({ createdAt: -1 });

    res.json(equipamentos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

/* GET /api/equipamentos/categorias */
router.get('/categorias', verificarToken, async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nome: 1 });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

/* GET /api/equipamentos/stats */
router.get('/stats', verificarToken, async (req, res) => {
  try {
    const total        = await Equipamento.countDocuments();
    const disponiveis  = await Equipamento.countDocuments({ estado: 'disponivel' });
    const requisitados = await Equipamento.countDocuments({ estado: 'requisitado' });
    const manutencao   = await Equipamento.countDocuments({ estado: 'em_manutencao' });
    const porCategoria = await Equipamento.aggregate([
      { $lookup: { from: 'categorias', localField: 'categoriaId', foreignField: '_id', as: 'categoria' } },
      { $unwind: '$categoria' },
      { $group: { _id: '$categoria.nome', total: { $sum: 1 }, cor: { $first: '$categoria.cor' }, icone: { $first: '$categoria.icone' } } }
    ]);
    res.json({ total, disponiveis, requisitados, manutencao, porCategoria });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

/* GET /api/equipamentos/:id */
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const equipamento = await Equipamento.findById(req.params.id).populate('categoriaId', 'nome icone cor');
    if (!equipamento) return res.status(404).json({ erro: 'Equipamento não encontrado.' });
    res.json(equipamento);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

/* POST /api/equipamentos — criar (só Admins) */
router.post('/', verificarToken, async (req, res) => {
  if (req.user.role !== 'Administrador') return res.status(403).json({ erro: 'Sem permissão. Só Administradores podem adicionar equipamentos.' });
  const { kit, descricao, categoriaId, quantidade, localizacao, marca, modelo, notas } = req.body;
  if (!kit || !descricao || !categoriaId) {
    return res.status(400).json({ erro: 'Código kit, descrição e categoria são obrigatórios.' });
  }
  try {
    const existe = await Equipamento.findOne({ kit });
    if (existe) return res.status(400).json({ erro: `O código "${kit}" já existe.` });

    const novo = await Equipamento.create({
      kit, descricao, categoriaId,
      quantidade: quantidade || 1,
      quantidadeDisponivel: quantidade || 1,
      localizacao, marca, modelo, notas,
    });
    const resultado = await Equipamento.findById(novo._id).populate('categoriaId', 'nome icone cor');
    res.status(201).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

/* PUT /api/equipamentos/:id — editar (só Admins) */
router.put('/:id', verificarToken, async (req, res) => {
  if (req.user.role !== 'Administrador') return res.status(403).json({ erro: 'Sem permissão. Só Administradores podem editar equipamentos.' });
  try {
    const atualizado = await Equipamento
      .findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('categoriaId', 'nome icone cor');
    if (!atualizado) return res.status(404).json({ erro: 'Equipamento não encontrado.' });
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

/* DELETE /api/equipamentos/:id — apagar (só Admins) */
router.delete('/:id', verificarToken, async (req, res) => {
  if (req.user.role !== 'Administrador') return res.status(403).json({ erro: 'Sem permissão. Só Administradores podem apagar equipamentos.' });
  try {
    const apagado = await Equipamento.findByIdAndDelete(req.params.id);
    if (!apagado) return res.status(404).json({ erro: 'Equipamento não encontrado.' });
    res.json({ mensagem: 'Equipamento apagado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

module.exports = router;