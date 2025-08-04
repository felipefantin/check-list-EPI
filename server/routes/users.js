const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireSafetyTechnician, 
  requireAdmin,
  canAccessUserData 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Listar usuários (com filtros)
// @access  Private (Safety Technician ou Admin)
router.get('/', [authenticateToken, requireSafetyTechnician], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      department, 
      isActive,
      search 
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (role) filters.role = role;
    if (department) filters.department = department;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    // Aplicar filtro de departamento se não for admin
    if (req.user.role !== 'admin') {
      filters.department = req.user.department;
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Buscar usuários
    const users = await User.find(filters)
      .select('-password')
      .populate('supervisor', 'name email')
      .populate('supervisedEmployees', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total
    const total = await User.countDocuments(filters);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar usuários'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Obter usuário específico
// @access  Private
router.get('/:id', [authenticateToken, canAccessUserData], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('supervisor', 'name email')
      .populate('supervisedEmployees', 'name email');

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao obter usuário'
    });
  }
});

// @route   POST /api/users
// @desc    Criar novo usuário
// @access  Private (Safety Technician ou Admin)
router.post('/', [
  authenticateToken,
  requireSafetyTechnician,
  body('name', 'Nome é obrigatório').notEmpty().trim(),
  body('email', 'Email é obrigatório').isEmail(),
  body('password', 'Senha deve ter pelo menos 6 caracteres').isLength({ min: 6 }),
  body('role', 'Função é obrigatória').isIn(['employee', 'supervisor', 'safety_technician', 'admin']),
  body('department', 'Departamento é obrigatório').notEmpty().trim()
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

    const { 
      name, 
      email, 
      password, 
      role, 
      department, 
      employeeId, 
      supervisor,
      hireDate 
    } = req.body;

    // Verificar se email já existe
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        error: 'Email já cadastrado',
        message: 'Este email já está sendo usado por outro usuário'
      });
    }

    // Verificar se matrícula já existe (se fornecida)
    if (employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({
          error: 'Matrícula já cadastrada',
          message: 'Esta matrícula já está sendo usada por outro usuário'
        });
      }
    }

    // Verificar permissões para criar admin
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Apenas administradores podem criar outros administradores'
      });
    }

    // Criar usuário
    const userData = {
      name,
      email,
      password,
      role,
      department,
      hireDate: hireDate || new Date()
    };

    if (employeeId) userData.employeeId = employeeId;
    if (supervisor) userData.supervisor = supervisor;

    const user = new User(userData);
    await user.save();

    // Atualizar lista de funcionários supervisionados se necessário
    if (supervisor) {
      await User.findByIdAndUpdate(supervisor, {
        $addToSet: { supervisedEmployees: user._id }
      });
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao criar usuário'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Atualizar usuário
// @access  Private (Safety Technician ou Admin)
router.put('/:id', [
  authenticateToken,
  requireSafetyTechnician,
  canAccessUserData,
  body('name', 'Nome é obrigatório').notEmpty().trim(),
  body('email', 'Email é obrigatório').isEmail(),
  body('role', 'Função é obrigatória').isIn(['employee', 'supervisor', 'safety_technician', 'admin']),
  body('department', 'Departamento é obrigatório').notEmpty().trim()
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

    const { 
      name, 
      email, 
      role, 
      department, 
      employeeId, 
      supervisor,
      isActive 
    } = req.body;

    // Buscar usuário
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se email já existe (se foi alterado)
    if (email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          error: 'Email já cadastrado',
          message: 'Este email já está sendo usado por outro usuário'
        });
      }
    }

    // Verificar se matrícula já existe (se foi alterada)
    if (employeeId && employeeId !== user.employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({
          error: 'Matrícula já cadastrada',
          message: 'Esta matrícula já está sendo usada por outro usuário'
        });
      }
    }

    // Verificar permissões para alterar admin
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Apenas administradores podem alterar outros administradores'
      });
    }

    // Atualizar supervisor se necessário
    if (supervisor && supervisor !== user.supervisor?.toString()) {
      // Remover do supervisor anterior
      if (user.supervisor) {
        await User.findByIdAndUpdate(user.supervisor, {
          $pull: { supervisedEmployees: user._id }
        });
      }
      
      // Adicionar ao novo supervisor
      await User.findByIdAndUpdate(supervisor, {
        $addToSet: { supervisedEmployees: user._id }
      });
    }

    // Atualizar usuário
    const updateData = {
      name,
      email,
      role,
      department
    };

    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (supervisor !== undefined) updateData.supervisor = supervisor;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao atualizar usuário'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Desativar usuário
// @access  Private (Safety Technician ou Admin)
router.delete('/:id', [authenticateToken, requireSafetyTechnician], async (req, res) => {
  try {
    // Buscar usuário
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões para desativar admin
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Apenas administradores podem desativar outros administradores'
      });
    }

    // Não permitir desativar a si mesmo
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Operação inválida',
        message: 'Você não pode desativar sua própria conta'
      });
    }

    // Desativar usuário (soft delete)
    user.isActive = false;
    await user.save();

    res.json({
      message: 'Usuário desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao desativar usuário'
    });
  }
});

// @route   GET /api/users/departments
// @desc    Listar departamentos
// @access  Private
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await User.distinct('department', { isActive: true });
    
    res.json({ departments });

  } catch (error) {
    console.error('Erro ao listar departamentos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar departamentos'
    });
  }
});

// @route   GET /api/users/supervisors
// @desc    Listar supervisores
// @access  Private
router.get('/supervisors', authenticateToken, async (req, res) => {
  try {
    const supervisors = await User.find({ 
      role: 'supervisor', 
      isActive: true 
    })
    .select('name email department')
    .sort({ name: 1 });

    res.json({ supervisors });

  } catch (error) {
    console.error('Erro ao listar supervisores:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar supervisores'
    });
  }
});

// @route   GET /api/users/team/:supervisorId
// @desc    Listar equipe de um supervisor
// @access  Private
router.get('/team/:supervisorId', [authenticateToken, canAccessUserData], async (req, res) => {
  try {
    const team = await User.find({ 
      supervisor: req.params.supervisorId,
      isActive: true 
    })
    .select('name email department role lastLogin')
    .sort({ name: 1 });

    res.json({ team });

  } catch (error) {
    console.error('Erro ao listar equipe:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar equipe'
    });
  }
});

module.exports = router; 