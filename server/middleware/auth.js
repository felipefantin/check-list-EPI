const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso não fornecido',
        message: 'É necessário fazer login para acessar este recurso'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Usuário não encontrado'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Usuário inativo',
        message: 'Sua conta foi desativada'
      });
    }
    
    // Adicionar usuário ao request
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Token de acesso é inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Sua sessão expirou, faça login novamente'
      });
    }
    
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Erro ao verificar autenticação'
    });
  }
};

// Middleware para verificar permissões específicas
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autenticado',
        message: 'É necessário fazer login'
      });
    }
    
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      });
    }
    
    next();
  };
};

// Middleware para verificar se é funcionário
const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Não autenticado',
      message: 'É necessário fazer login'
    });
  }
  
  if (!['employee', 'supervisor', 'safety_technician', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas funcionários podem acessar este recurso'
    });
  }
  
  next();
};

// Middleware para verificar se é supervisor ou superior
const requireSupervisor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Não autenticado',
      message: 'É necessário fazer login'
    });
  }
  
  if (!['supervisor', 'safety_technician', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas supervisores podem acessar este recurso'
    });
  }
  
  next();
};

// Middleware para verificar se é técnico de segurança ou admin
const requireSafetyTechnician = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Não autenticado',
      message: 'É necessário fazer login'
    });
  }
  
  if (!['safety_technician', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas técnicos de segurança podem acessar este recurso'
    });
  }
  
  next();
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Não autenticado',
      message: 'É necessário fazer login'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas administradores podem acessar este recurso'
    });
  }
  
  next();
};

// Middleware para verificar se pode acessar dados de outro usuário
const canAccessUserData = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  if (!targetUserId) {
    return next();
  }
  
  // Admin pode acessar qualquer usuário
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Técnico de segurança pode acessar qualquer usuário
  if (req.user.role === 'safety_technician') {
    return next();
  }
  
  // Supervisor pode acessar funcionários da sua equipe
  if (req.user.role === 'supervisor') {
    if (req.user.supervisedEmployees.includes(targetUserId)) {
      return next();
    }
  }
  
  // Funcionário só pode acessar seus próprios dados
  if (req.user._id.toString() === targetUserId) {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'Acesso negado',
    message: 'Você não tem permissão para acessar estes dados'
  });
};

// Middleware para verificar se pode acessar dados do departamento
const canAccessDepartmentData = (req, res, next) => {
  const targetDepartment = req.params.department || req.body.department;
  
  if (!targetDepartment) {
    return next();
  }
  
  // Admin pode acessar qualquer departamento
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Técnico de segurança pode acessar qualquer departamento
  if (req.user.role === 'safety_technician') {
    return next();
  }
  
  // Supervisor só pode acessar seu próprio departamento
  if (req.user.role === 'supervisor') {
    if (req.user.department === targetDepartment) {
      return next();
    }
  }
  
  // Funcionário só pode acessar seu próprio departamento
  if (req.user.department === targetDepartment) {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'Acesso negado',
    message: 'Você não tem permissão para acessar dados deste departamento'
  });
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireEmployee,
  requireSupervisor,
  requireSafetyTechnician,
  requireAdmin,
  canAccessUserData,
  canAccessDepartmentData
}; 