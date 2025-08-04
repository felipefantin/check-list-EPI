const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// @route   POST /api/auth/login
// @desc    Login de usuário
// @access  Public
router.post('/login', [
  body('email', 'Email é obrigatório').isEmail(),
  body('password', 'Senha é obrigatória').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuário por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Conta desativada',
        message: 'Sua conta foi desativada. Entre em contato com o administrador.'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Atualizar último login
    await user.updateLastLogin();

    // Gerar token
    const token = generateToken(user._id);

    // Retornar dados do usuário (sem senha) e token
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: user.toPublicJSON(),
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao realizar login'
    });
  }
});

// @route   POST /api/auth/login-employee
// @desc    Login de funcionário por matrícula
// @access  Public
router.post('/login-employee', [
  body('employeeId', 'Matrícula é obrigatória').notEmpty(),
  body('password', 'Senha é obrigatória').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { employeeId, password } = req.body;

    // Buscar usuário por matrícula
    const user = await User.findOne({ employeeId });
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Matrícula ou senha incorretos'
      });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Conta desativada',
        message: 'Sua conta foi desativada. Entre em contato com o administrador.'
      });
    }

    // Verificar se é funcionário
    if (!['employee', 'supervisor', 'safety_technician', 'admin'].includes(user.role)) {
      return res.status(401).json({
        error: 'Acesso negado',
        message: 'Apenas funcionários podem fazer login por matrícula'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Matrícula ou senha incorretos'
      });
    }

    // Atualizar último login
    await user.updateLastLogin();

    // Gerar token
    const token = generateToken(user._id);

    // Retornar dados do usuário (sem senha) e token
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: user.toPublicJSON(),
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Erro no login por matrícula:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao realizar login'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Renovar token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Gerar novo token
    const token = generateToken(req.user._id);

    res.json({
      message: 'Token renovado com sucesso',
      token,
      user: req.user.toPublicJSON(),
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao renovar token'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout de usuário
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Em uma implementação mais robusta, você poderia:
    // 1. Adicionar o token a uma blacklist
    // 2. Invalidar o token no cliente
    // 3. Registrar o logout no banco de dados

    res.json({
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao realizar logout'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obter dados do usuário logado
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao obter dados do usuário'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Alterar senha do usuário
// @access  Private
router.post('/change-password', [
  authenticateToken,
  body('currentPassword', 'Senha atual é obrigatória').isLength({ min: 6 }),
  body('newPassword', 'Nova senha deve ter pelo menos 6 caracteres').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Buscar usuário com senha
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Senha atual incorreta',
        message: 'A senha atual informada está incorreta'
      });
    }

    // Verificar se nova senha é diferente da atual
    const isNewPasswordSame = await user.comparePassword(newPassword);
    if (isNewPasswordSame) {
      return res.status(400).json({
        error: 'Nova senha inválida',
        message: 'A nova senha deve ser diferente da senha atual'
      });
    }

    // Alterar senha
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao alterar senha'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Solicitar redefinição de senha
// @access  Public
router.post('/forgot-password', [
  body('email', 'Email é obrigatório').isEmail()
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      // Por segurança, não informar se o email existe ou não
      return res.json({
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
      });
    }

    // Em uma implementação completa, você enviaria um email com link para redefinição
    // Por enquanto, apenas retornamos uma mensagem genérica
    res.json({
      message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
    });

  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao solicitar redefinição de senha'
    });
  }
});

module.exports = router; 