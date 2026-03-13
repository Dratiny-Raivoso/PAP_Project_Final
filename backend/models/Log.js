const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acao:    { type: String, required: true },
  detalhe: { type: String },
  ip:      { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);