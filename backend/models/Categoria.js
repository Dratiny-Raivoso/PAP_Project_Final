/* ═══════════════════════════════════════════════════════
   LED · backend/models/Categoria.js
   Modelo de categoria no MongoDB
═══════════════════════════════════════════════════════ */

const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nome:  { type: String, required: true, trim: true },
  icone: { type: String },
  cor:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Categoria', categoriaSchema);