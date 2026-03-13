/* ═══════════════════════════════════════════════════════
   LED · backend/models/Equipamento.js
   Modelo de equipamento no MongoDB
═══════════════════════════════════════════════════════ */

const mongoose = require('mongoose');

const equipamentoSchema = new mongoose.Schema({
  kit:                  { type: String, required: true, unique: true, trim: true },
  descricao:            { type: String, required: true, trim: true },
  categoriaId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
  quantidade:           { type: Number, default: 1, min: 0 },
  quantidadeDisponivel: { type: Number, default: 1, min: 0 },
  estado:               {
    type:    String,
    enum:    ['disponivel', 'requisitado', 'em_manutencao', 'danificado'],
    default: 'disponivel',
  },
  localizacao:          { type: String, trim: true },
  marca:                { type: String, trim: true },
  modelo:               { type: String, trim: true },
  notas:                { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Equipamento', equipamentoSchema);