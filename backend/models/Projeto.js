/* ═══════════════════════════════════════════════════════
   LED · backend/models/Projeto.js
   Modelo de projeto no MongoDB
═══════════════════════════════════════════════════════ */

const mongoose = require('mongoose');

const projetoSchema = new mongoose.Schema({
  nome:        { type: String, required: true, trim: true },
  descricao:   { type: String, trim: true },
  estado:      { type: String, enum: ['ativo', 'pausado', 'concluido'], default: 'ativo' },
  criadorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membros:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  equipamentos:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipamento' }],
  dataInicio:  { type: Date, default: Date.now },
  dataFim:     { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Projeto', projetoSchema, 'projetos');