/* ═══════════════════════════════════════════════════════
   LED · backend/routes/requisicoes.js
   Rotas de requisições — criar, listar, devolver
═══════════════════════════════════════════════════════ */

const express    = require('express');
const Requisicao  = require('../models/Requisicao');
const Equipamento = require('../models/Equipamento');
const { verificarToken } = require('./auth');
const router     = express.Router();


/* ═══════════════════════════════════════════════════════
   GET /api/requisicoes
   Listar todas as requisições (com dados preenchidos)
═══════════════════════════════════════════════════════ */
router.get('/', verificarToken, async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;

    // Verificar requisições atrasadas automaticamente
    await Requisicao.updateMany(
      {
        estado: 'ativa',
        dataDevolucaoPrevista: { $lt: new Date() },
      },
      { estado: 'atrasada' }
    );

    const requisicoes = await Requisicao.find(filtro)
      .populate('equipamentoId', 'kit descricao categoriaId')
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(requisicoes);
  } catch (err) {
    console.error('Erro ao listar requisições:', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   GET /api/requisicoes/stats
   Estatísticas das requisições para o dashboard
═══════════════════════════════════════════════════════ */
router.get('/stats', verificarToken, async (req, res) => {
  try {
    const ativas     = await Requisicao.countDocuments({ estado: 'ativa' });
    const atrasadas  = await Requisicao.countDocuments({ estado: 'atrasada' });
    const devolvidas = await Requisicao.countDocuments({ estado: 'devolvida' });
    const total      = await Requisicao.countDocuments();

    res.json({ ativas, atrasadas, devolvidas, total });
  } catch (err) {
    console.error('Erro nas stats:', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   POST /api/requisicoes
   Criar nova requisição
═══════════════════════════════════════════════════════ */
router.post('/', verificarToken, async (req, res) => {
  const { equipamentoId, dataDevolucaoPrevista, notas } = req.body;

  if (!equipamentoId || !dataDevolucaoPrevista) {
    return res.status(400).json({ erro: 'Equipamento e data de devolução são obrigatórios.' });
  }

  try {
    // Verificar se o equipamento existe e está disponível
    const equipamento = await Equipamento.findById(equipamentoId);
    if (!equipamento) {
      return res.status(404).json({ erro: 'Equipamento não encontrado.' });
    }
    if (equipamento.quantidadeDisponivel <= 0) {
      return res.status(400).json({ erro: 'Este equipamento não tem unidades disponíveis.' });
    }

    // Criar a requisição
    const novaRequisicao = await Requisicao.create({
      equipamentoId,
      userId:                req.user.id, // utilizador autenticado
      dataDevolucaoPrevista: new Date(dataDevolucaoPrevista),
      notas,
    });

    // Atualizar o estado e quantidade disponível do equipamento
    await Equipamento.findByIdAndUpdate(equipamentoId, {
      $inc:   { quantidadeDisponivel: -1 },
      estado: equipamento.quantidadeDisponivel - 1 <= 0 ? 'requisitado' : 'disponivel',
    });

    // Devolver com dados preenchidos
    const resultado = await Requisicao.findById(novaRequisicao._id)
      .populate('equipamentoId', 'kit descricao')
      .populate('userId', 'name email');

    res.status(201).json(resultado);
  } catch (err) {
    console.error('Erro ao criar requisição:', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   PUT /api/requisicoes/:id/devolver
   Registar devolução de equipamento
═══════════════════════════════════════════════════════ */
router.put('/:id/devolver', verificarToken, async (req, res) => {
  try {
    const requisicao = await Requisicao.findById(req.params.id);
    if (!requisicao) {
      return res.status(404).json({ erro: 'Requisição não encontrada.' });
    }
    if (requisicao.estado === 'devolvida') {
      return res.status(400).json({ erro: 'Esta requisição já foi devolvida.' });
    }

    // Marcar como devolvida
    await Requisicao.findByIdAndUpdate(req.params.id, {
      estado:            'devolvida',
      dataDevolucaoReal: new Date(),
    });

    // Atualizar quantidade disponível do equipamento
    const equipamento = await Equipamento.findById(requisicao.equipamentoId);
    if (equipamento) {
      const novaQtd = equipamento.quantidadeDisponivel + 1;
      await Equipamento.findByIdAndUpdate(requisicao.equipamentoId, {
        quantidadeDisponivel: novaQtd,
        estado: novaQtd >= equipamento.quantidade ? 'disponivel' : 'requisitado',
      });
    }

    const resultado = await Requisicao.findById(req.params.id)
      .populate('equipamentoId', 'kit descricao')
      .populate('userId', 'name email');

    res.json(resultado);
  } catch (err) {
    console.error('Erro ao devolver:', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   DELETE /api/requisicoes/:id
   Cancelar/apagar uma requisição
═══════════════════════════════════════════════════════ */
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const requisicao = await Requisicao.findById(req.params.id);
    if (!requisicao) {
      return res.status(404).json({ erro: 'Requisição não encontrada.' });
    }

    // Se estava ativa, devolver o equipamento ao stock
    if (requisicao.estado !== 'devolvida') {
      const equipamento = await Equipamento.findById(requisicao.equipamentoId);
      if (equipamento) {
        const novaQtd = equipamento.quantidadeDisponivel + 1;
        await Equipamento.findByIdAndUpdate(requisicao.equipamentoId, {
          quantidadeDisponivel: novaQtd,
          estado: novaQtd >= equipamento.quantidade ? 'disponivel' : 'requisitado',
        });
      }
    }

    await Requisicao.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Requisição cancelada com sucesso.' });
  } catch (err) {
    console.error('Erro ao cancelar:', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


module.exports = router;