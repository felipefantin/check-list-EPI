const express = require('express');
const { body, validationResult } = require('express-validator');
const Checklist = require('../models/Checklist');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireSafetyTechnician,
  canAccessDepartmentData 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/checklists
// @desc    Listar checklists
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      department, 
      isActive,
      search 
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Aplicar filtro de departamento se não for admin ou técnico de segurança
    if (!['admin', 'safety_technician'].includes(req.user.role)) {
      filters.$or = [
        { department: req.user.department },
        { department: null } // Checklists globais
      ];
    } else if (department) {
      filters.department = department;
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Buscar checklists
    const checklists = await Checklist.find(filters)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate({
        path: 'items.epiType',
        select: 'name category manufacturer'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total
    const total = await Checklist.countDocuments(filters);

    res.json({
      checklists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar checklists:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar checklists'
    });
  }
});

// @route   GET /api/checklists/available
// @desc    Listar checklists disponíveis para o usuário
// @access  Private
router.get('/available', authenticateToken, async (req, res) => {
  try {
    // Buscar checklists que se aplicam ao usuário
    const checklists = await Checklist.find({
      isActive: true,
      $or: [
        { department: req.user.department },
        { department: null } // Checklists globais
      ]
    })
    .populate({
      path: 'items.epiType',
      select: 'name category manufacturer description'
    })
    .sort({ name: 1 });

    // Filtrar checklists vigentes
    const availableChecklists = checklists.filter(checklist => 
      checklist.isEffective()
    );

    res.json({ checklists: availableChecklists });

  } catch (error) {
    console.error('Erro ao listar checklists disponíveis:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar checklists disponíveis'
    });
  }
});

// @route   GET /api/checklists/:id
// @desc    Obter checklist específico
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate({
        path: 'items.epiType',
        select: 'name category manufacturer description inspectionCriteria'
      });

    if (!checklist) {
      return res.status(404).json({
        error: 'Checklist não encontrado'
      });
    }

    // Verificar se usuário pode acessar este checklist
    if (!checklist.appliesToUser(req.user)) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este checklist'
      });
    }

    res.json({ checklist });

  } catch (error) {
    console.error('Erro ao obter checklist:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao obter checklist'
    });
  }
});

// @route   POST /api/checklists
// @desc    Criar novo checklist
// @access  Private (Safety Technician)
router.post('/', [
  authenticateToken,
  requireSafetyTechnician,
  body('name', 'Nome é obrigatório').notEmpty().trim(),
  body('description', 'Descrição é obrigatória').notEmpty().trim(),
  body('type', 'Tipo é obrigatório').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on_demand']),
  body('items', 'Itens são obrigatórios').isArray({ min: 1 }),
  body('items.*.epiType', 'Tipo de EPI é obrigatório').notEmpty(),
  body('frequencyDays', 'Frequência é obrigatória').isInt({ min: 1 })
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
      description, 
      type, 
      department, 
      jobRole,
      items, 
      frequencyDays,
      preferredTime,
      effectiveDate,
      expiryDate,
      notes 
    } = req.body;

    // Verificar se nome já existe
    const existingChecklist = await Checklist.findOne({ name });
    if (existingChecklist) {
      return res.status(400).json({
        error: 'Nome já existe',
        message: 'Já existe um checklist com este nome'
      });
    }

    // Criar checklist
    const checklistData = {
      name,
      description,
      type,
      items,
      frequencyDays,
      createdBy: req.user._id
    };

    if (department) checklistData.department = department;
    if (jobRole) checklistData.jobRole = jobRole;
    if (preferredTime) checklistData.preferredTime = preferredTime;
    if (effectiveDate) checklistData.effectiveDate = new Date(effectiveDate);
    if (expiryDate) checklistData.expiryDate = new Date(expiryDate);
    if (notes) checklistData.notes = notes;

    const checklist = new Checklist(checklistData);
    await checklist.save();

    // Popular dados para retorno
    await checklist.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'items.epiType', select: 'name category manufacturer' }
    ]);

    res.status(201).json({
      message: 'Checklist criado com sucesso',
      checklist: checklist.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao criar checklist:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao criar checklist'
    });
  }
});

// @route   PUT /api/checklists/:id
// @desc    Atualizar checklist
// @access  Private (Safety Technician)
router.put('/:id', [
  authenticateToken,
  requireSafetyTechnician,
  body('name', 'Nome é obrigatório').notEmpty().trim(),
  body('description', 'Descrição é obrigatória').notEmpty().trim(),
  body('type', 'Tipo é obrigatório').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on_demand']),
  body('items', 'Itens são obrigatórios').isArray({ min: 1 }),
  body('items.*.epiType', 'Tipo de EPI é obrigatório').notEmpty(),
  body('frequencyDays', 'Frequência é obrigatória').isInt({ min: 1 })
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
      description, 
      type, 
      department, 
      jobRole,
      items, 
      frequencyDays,
      preferredTime,
      effectiveDate,
      expiryDate,
      isActive,
      notes 
    } = req.body;

    // Buscar checklist
    const checklist = await Checklist.findById(req.params.id);
    if (!checklist) {
      return res.status(404).json({
        error: 'Checklist não encontrado'
      });
    }

    // Verificar se nome já existe (se foi alterado)
    if (name !== checklist.name) {
      const existingChecklist = await Checklist.findOne({ name });
      if (existingChecklist) {
        return res.status(400).json({
          error: 'Nome já existe',
          message: 'Já existe um checklist com este nome'
        });
      }
    }

    // Atualizar checklist
    const updateData = {
      name,
      description,
      type,
      items,
      frequencyDays
    };

    if (department !== undefined) updateData.department = department;
    if (jobRole !== undefined) updateData.jobRole = jobRole;
    if (preferredTime !== undefined) updateData.preferredTime = preferredTime;
    if (effectiveDate !== undefined) updateData.effectiveDate = new Date(effectiveDate);
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;

    // Incrementar versão se houve mudanças significativas
    if (JSON.stringify(items) !== JSON.stringify(checklist.items)) {
      updateData.version = checklist.version + 1;
    }

    const updatedChecklist = await Checklist.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate({
      path: 'items.epiType',
      select: 'name category manufacturer'
    });

    res.json({
      message: 'Checklist atualizado com sucesso',
      checklist: updatedChecklist.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao atualizar checklist'
    });
  }
});

// @route   DELETE /api/checklists/:id
// @desc    Desativar checklist
// @access  Private (Safety Technician)
router.delete('/:id', [authenticateToken, requireSafetyTechnician], async (req, res) => {
  try {
    // Buscar checklist
    const checklist = await Checklist.findById(req.params.id);
    if (!checklist) {
      return res.status(404).json({
        error: 'Checklist não encontrado'
      });
    }

    // Desativar checklist (soft delete)
    checklist.isActive = false;
    await checklist.save();

    res.json({
      message: 'Checklist desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar checklist:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao desativar checklist'
    });
  }
});

// @route   POST /api/checklists/:id/approve
// @desc    Aprovar checklist
// @access  Private (Safety Technician)
router.post('/:id/approve', [
  authenticateToken,
  requireSafetyTechnician,
  body('notes', 'Observações são obrigatórias').notEmpty().trim()
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

    const { notes } = req.body;

    // Buscar checklist
    const checklist = await Checklist.findById(req.params.id);
    if (!checklist) {
      return res.status(404).json({
        error: 'Checklist não encontrado'
      });
    }

    // Aprovar checklist
    checklist.approvedBy = req.user._id;
    checklist.approvedAt = new Date();
    await checklist.save();

    res.json({
      message: 'Checklist aprovado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao aprovar checklist:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao aprovar checklist'
    });
  }
});

// @route   GET /api/checklists/types
// @desc    Listar tipos de checklist
// @access  Private
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const types = [
      { value: 'daily', label: 'Diário' },
      { value: 'weekly', label: 'Semanal' },
      { value: 'monthly', label: 'Mensal' },
      { value: 'quarterly', label: 'Trimestral' },
      { value: 'annual', label: 'Anual' },
      { value: 'on_demand', label: 'Sob Demanda' }
    ];
    
    res.json({ types });

  } catch (error) {
    console.error('Erro ao listar tipos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar tipos'
    });
  }
});

module.exports = router; 