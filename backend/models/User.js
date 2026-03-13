/* ═══════════════════════════════════════════════════════
   LED · backend/models/User.js
   Modelo de utilizador no MongoDB
═══════════════════════════════════════════════════════ */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String,  required: true },
  email:     { type: String,  required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String,  required: true },
  role:      { type: String,  default: 'Utilizador', enum: ['Utilizador', 'Professor', 'Técnico', 'Administrador'] },
  ativo:     { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true }); // cria createdAt e updatedAt automaticamente

module.exports = mongoose.model('User', userSchema);