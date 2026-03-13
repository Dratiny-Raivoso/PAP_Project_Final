/* ═══════════════════════════════════════════════════════
   LED · backend/models/Requisicao.js
   Modelo de requisição no MongoDB
═══════════════════════════════════════════════════════ */

const mongoose = require('mongoose');

const requisicaoSchema = new mongoose.Schema({
  equipamentoId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Equipamento',
    required: true,
  },
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  dataRequisicao: {
    type:    Date,
    default: Date.now,
  },
  dataDevolucaoPrevista: {
    type:     Date,
    required: true,
  },
  dataDevolucaoReal: {
    type:    Date,
    default: null,
  },
  estado: {
    type:    String,
    enum:    ['ativa', 'devolvida', 'atrasada'],
    default: 'ativa',
  },
  notas: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Requisicao', requisicaoSchema, 'requisicoes');