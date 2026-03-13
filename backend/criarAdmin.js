require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');

async function criarAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const hash = await bcrypt.hash('admin123', 10);
  
  await User.findOneAndUpdate(
    { email: 'admin@led.pt' },
    { name: 'Administrador', email: 'admin@led.pt', password: hash, role: 'Administrador', ativo: true },
    { upsert: true, new: true }
  );

  console.log('✅ Conta admin criada!');
  console.log('📧 Email:    admin@led.pt');
  console.log('🔑 Password: admin123');
  process.exit(0);
}

criarAdmin();