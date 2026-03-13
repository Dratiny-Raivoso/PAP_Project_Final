/* ═══════════════════════════════════════════════════════
   LED · backend/routes/auth.js
   Rotas de autenticação — registo, login, perfil
═══════════════════════════════════════════════════════ */

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();


/* ═══════════════════════════════════════════════════════
   MIDDLEWARE — verificar token JWT
   Usado nas rotas que precisam de login para funcionar
═══════════════════════════════════════════════════════ */
function verificarToken(req, res, next) {
  // O token vem no header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Token em falta.' });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.user = dados; // guarda os dados do utilizador no request
    next();
  } catch (err) {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
}


/* ═══════════════════════════════════════════════════════
   POST /api/auth/register
   Criar uma nova conta
═══════════════════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // 1. Validar campos obrigatórios
  if (!name || !email || !password) {
    return res.status(400).json({ erro: 'Nome, email e password são obrigatórios.' });
  }

  // 2. Validar tamanho da password
  if (password.length < 6) {
    return res.status(400).json({ erro: 'A password deve ter mínimo 6 caracteres.' });
  }

  try {
    // 3. Verificar se o email já existe
    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ erro: 'Este email já está registado.' });
    }

    // 4. Encriptar a password (nunca guardar em texto simples)
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Criar o utilizador na base de dados
    const novoUser = await User.create({
      name,
      email,
      password: passwordHash,
      role:     role || 'Utilizador',
    });

    // 6. Responder com sucesso (sem devolver a password)
    res.status(201).json({
      mensagem: 'Conta criada com sucesso!',
      user: {
        id:    novoUser._id,
        name:  novoUser.name,
        email: novoUser.email,
        role:  novoUser.role,
      }
    });

  } catch (err) {
    console.error('Erro no registo:', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   POST /api/auth/login
   Entrar com email e password
═══════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validar campos
  if (!email || !password) {
    return res.status(400).json({ erro: 'Email e password são obrigatórios.' });
  }

  try {
    // 2. Procurar o utilizador pelo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ erro: 'Email ou password incorretos.' });
    }

    // 3. Verificar se a conta está ativa
    if (!user.ativo) {
      return res.status(403).json({ erro: 'Esta conta está desativada.' });
    }

    // 4. Comparar a password com o hash guardado
    const passwordCorreta = await bcrypt.compare(password, user.password);
    if (!passwordCorreta) {
      return res.status(401).json({ erro: 'Email ou password incorretos.' });
    }

    // 5. Criar o token JWT (válido 24 horas)
    const token = jwt.sign(
      {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 6. Atualizar a data do último login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // 7. Responder com o token e dados do utilizador
    res.json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      }
    });

  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   GET /api/auth/perfil
   Ver os dados do utilizador autenticado
   (precisa de token — usa o middleware verificarToken)
═══════════════════════════════════════════════════════ */
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    // Buscar utilizador pelo ID que está no token
    // .select('-password') exclui a password da resposta
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    }

    res.json(user);

  } catch (err) {
    console.error('Erro ao buscar perfil:', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});




/* ═══════════════════════════════════════════════════════
   GET /api/auth/utilizadores
   Listar todos os utilizadores (só Admins)
═══════════════════════════════════════════════════════ */
router.get('/utilizadores', verificarToken, async (req, res) => {
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ erro: 'Sem permissão.' });
  }
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   PUT /api/auth/utilizadores/:id
   Editar perfil ou ativar/desativar conta (só Admins)
═══════════════════════════════════════════════════════ */
router.put('/utilizadores/:id', verificarToken, async (req, res) => {
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ erro: 'Sem permissão.' });
  }
  // Não permitir que o admin se desative a si próprio
  if (req.params.id === req.user.id && req.body.ativo === false) {
    return res.status(400).json({ erro: 'Não podes desativar a tua própria conta.' });
  }
  try {
    const { name, role, ativo } = req.body;
    const atualizado = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, ativo },
      { new: true }
    ).select('-password');

    if (!atualizado) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


/* ═══════════════════════════════════════════════════════
   DELETE /api/auth/utilizadores/:id
   Apagar conta (só Admins, não pode apagar a sua)
═══════════════════════════════════════════════════════ */
router.delete('/utilizadores/:id', verificarToken, async (req, res) => {
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ erro: 'Sem permissão.' });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ erro: 'Não podes apagar a tua própria conta.' });
  }
  try {
    const apagado = await User.findByIdAndDelete(req.params.id);
    if (!apagado) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    res.json({ mensagem: 'Conta apagada com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});



/* ═══════════════════════════════════════════════════════
   PUT /api/auth/perfil
   Atualizar o próprio perfil (nome e/ou password)
═══════════════════════════════════════════════════════ */
router.put('/perfil', verificarToken, async (req, res) => {
  const { name, passwordAtual, passwordNova } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ erro: 'Utilizador não encontrado.' });

    // Atualizar nome se fornecido
    if (name) user.name = name;

    // Atualizar password se fornecida
    if (passwordNova) {
      if (!passwordAtual) return res.status(400).json({ erro: 'Introduz a password atual para a alterar.' });
      const correta = await bcrypt.compare(passwordAtual, user.password);
      if (!correta) return res.status(400).json({ erro: 'Password atual incorreta.' });
      if (passwordNova.length < 6) return res.status(400).json({ erro: 'A nova password deve ter pelo menos 6 caracteres.' });
      user.password = await bcrypt.hash(passwordNova, 10);
    }

    await user.save();
    const { password, ...userSemPassword } = user.toObject();
    res.json(userSemPassword);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});


// Exportar o router para usar no server.js
module.exports = router;
module.exports.verificarToken = verificarToken; // exportar também o middleware