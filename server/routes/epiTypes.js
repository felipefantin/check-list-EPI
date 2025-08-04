const express = require('express');
const { body, validationResult } = require('express-validator');
const EpiType = require('../models/EpiType');
const { 
  authenticateToken, 
  requireSafetyTechnician 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/epi-types
// @desc    Listar tipos de EPI
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      isActive,
      search,
      expiringSoon 
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { caNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtrar por CA vencendo em breve
    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filters.caExpiryDate = { $lte: thirtyDaysFromNow, $gte: new Date() };
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Buscar tipos de EPI
    const epiTypes = await EpiType.find(filters)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total
    const total = await EpiType.countDocuments(filters);

    res.json({
      epiTypes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar tipos de EPI:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar tipos de EPI'
    });
  }
});

// @route   GET /api/epi-types/:id
// @desc    Obter tipo de EPI específico
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const epiType = await EpiType.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!epiType) {
      return res.status(404).json({
        error: 'Tipo de EPI não encontrado'
      });
    }

    res.json({ epiType });

  } catch (error) {
    console.error('Erro ao obter tipo de EPI:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao obter tipo de EPI'
    });
  }
});

// @route   POST /api/epi-types
// @desc    Criar novo tipo de EPI
// @access  Private (Safety Technician)
router.post('/', [
  authenticateToken,
  requireSafetyTechnician,
  body('name', 'Nome é obrigatório').notEmpty().trim(),
  body('category', 'Categoria é obrigatória').isIn([
    'protecao_cabeca',
    'protecao_auditiva', 
    'protecao_visual',
    'protecao_respiratoria',
    'protecao_tronco',
    'protecao_membros_superiores',
    'protecao_membros_inferiores',
    'protecao_corpo_inteiro',
    'protecao_queda',
    'protecao_maos',
    'protecao_pes'
  ]),
  body('description', 'Descrição é obrigatória').notEmpty().trim(),
  body('technicalStandard', 'Norma técnica é obrigatória').notEmpty().trim(),
  body('manufacturer', 'Fabricante é obrigatório').notEmpty().trim(),
  body('caNumber', 'Número do CA é obrigatório').notEmpty().trim(),
  body('caExpiryDate', 'Data de validade do CA é obrigatória').isISO8601(),
  body('lifespanMonths', 'Vida útil é obrigatória').isInt({ min: 1 })
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
      category, 
      description, 
      technicalStandard, 
      manufacturer, 
      model,
      caNumber, 
      caExpiryDate, 
      lifespanMonths,
      inspectionCriteria,
      notes 
    } = req.body;

    // Verificar se número do CA já existe
    const existingCA = await EpiType.findOne({ caNumber });
    if (existingCA) {
      return res.status(400).json({
        error: 'CA já cadastrado',
        message: 'Este número de CA já está sendo usado por outro EPI'
      });
    }

    // Criar tipo de EPI
    const epiTypeData = {
      name,
      category,
      description,
      technicalStandard,
      manufacturer,
      caNumber,
      caExpiryDate: new Date(caExpiryDate),
      lifespanMonths,
      createdBy: req.user._id
    };

    if (model) epiTypeData.model = model;
    if (inspectionCriteria) epiTypeData.inspectionCriteria = inspectionCriteria;
    if (notes) epiTypeData.notes = notes;

    const epiType = new EpiType(epiTypeData);
    await epiType.save();

    res.status(201).json({
      message: 'Tipo de EPI criado com sucesso',
      epiType: epiType.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao criar tipo de EPI:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao criar tipo de EPI'
    });
  }
});

// @route   PUT /api/epi-types/:id
// @desc    Atualizar tipo de EPI
// @access  Private (Safety Technician)
router.put('/:id', [
  authenticateToken,
  requireSafetyTechnician,
  body('name', 'Nome é obrigatório').notEmpty().trim(),
  body('category', 'Categoria é obrigatória').isIn([
    'protecao_cabeca',
    'protecao_auditiva', 
    'protecao_visual',
    'protecao_respiratoria',
    'protecao_tronco',
    'protecao_membros_superiores',
    'protecao_membros_inferiores',
    'protecao_corpo_inteiro',
    'protecao_queda',
    'protecao_maos',
    'protecao_pes'
  ]),
  body('description', 'Descrição é obrigatória').notEmpty().trim(),
  body('technicalStandard', 'Norma técnica é obrigatória').notEmpty().trim(),
  body('manufacturer', 'Fabricante é obrigatório').notEmpty().trim(),
  body('caExpiryDate', 'Data de validade do CA é obrigatória').isISO8601(),
  body('lifespanMonths', 'Vida útil é obrigatória').isInt({ min: 1 })
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
      category, 
      description, 
      technicalStandard, 
      manufacturer, 
      model,
      caNumber, 
      caExpiryDate, 
      lifespanMonths,
      inspectionCriteria,
      isActive,
      notes 
    } = req.body;

    // Buscar tipo de EPI
    const epiType = await EpiType.findById(req.params.id);
    if (!epiType) {
      return res.status(404).json({
        error: 'Tipo de EPI não encontrado'
      });
    }

    // Verificar se número do CA já existe (se foi alterado)
    if (caNumber && caNumber !== epiType.caNumber) {
      const existingCA = await EpiType.findOne({ caNumber });
      if (existingCA) {
        return res.status(400).json({
          error: 'CA já cadastrado',
          message: 'Este número de CA já está sendo usado por outro EPI'
        });
      }
    }

    // Atualizar tipo de EPI
    const updateData = {
      name,
      category,
      description,
      technicalStandard,
      manufacturer,
      caExpiryDate: new Date(caExpiryDate),
      lifespanMonths
    };

    if (model !== undefined) updateData.model = model;
    if (caNumber !== undefined) updateData.caNumber = caNumber;
    if (inspectionCriteria !== undefined) updateData.inspectionCriteria = inspectionCriteria;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;

    const updatedEpiType = await EpiType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Tipo de EPI atualizado com sucesso',
      epiType: updatedEpiType.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar tipo de EPI:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao atualizar tipo de EPI'
    });
  }
});

// @route   DELETE /api/epi-types/:id
// @desc    Desativar tipo de EPI
// @access  Private (Safety Technician)
router.delete('/:id', [authenticateToken, requireSafetyTechnician], async (req, res) => {
  try {
    // Buscar tipo de EPI
    const epiType = await EpiType.findById(req.params.id);
    if (!epiType) {
      return res.status(404).json({
        error: 'Tipo de EPI não encontrado'
      });
    }

    // Desativar tipo de EPI (soft delete)
    epiType.isActive = false;
    await epiType.save();

    res.json({
      message: 'Tipo de EPI desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar tipo de EPI:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao desativar tipo de EPI'
    });
  }
});

// @route   GET /api/epi-types/categories
// @desc    Listar categorias de EPI
// @access  Private
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { value: 'protecao_cabeca', label: 'Proteção para Cabeça' },
      { value: 'protecao_auditiva', label: 'Proteção Auditiva' },
      { value: 'protecao_visual', label: 'Proteção Visual' },
      { value: 'protecao_respiratoria', label: 'Proteção Respiratória' },
      { value: 'protecao_tronco', label: 'Proteção para Tronco' },
      { value: 'protecao_membros_superiores', label: 'Proteção para Membros Superiores' },
      { value: 'protecao_membros_inferiores', label: 'Proteção para Membros Inferiores' },
      { value: 'protecao_corpo_inteiro', label: 'Proteção para Corpo Inteiro' },
      { value: 'protecao_queda', label: 'Proteção contra Quedas' },
      { value: 'protecao_maos', label: 'Proteção para Mãos' },
      { value: 'protecao_pes', label: 'Proteção para Pés' }
    ];
    
    res.json({ categories });

  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar categorias'
    });
  }
});

// @route   GET /api/epi-types/expiring-soon
// @desc    Listar EPIs com CA vencendo em breve
// @access  Private
router.get('/expiring-soon', authenticateToken, async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringEpiTypes = await EpiType.find({
      caExpiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      isActive: true
    })
    .populate('createdBy', 'name email')
    .sort({ caExpiryDate: 1 });

    res.json({ expiringEpiTypes });

  } catch (error) {
    console.error('Erro ao listar EPIs vencendo em breve:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar EPIs vencendo em breve'
    });
  }
});

// @route   GET /api/epi-types/expired
// @desc    Listar EPIs com CA vencido
// @access  Private
router.get('/expired', authenticateToken, async (req, res) => {
  try {
    const expiredEpiTypes = await EpiType.find({
      caExpiryDate: { $lt: new Date() },
      isActive: true
    })
    .populate('createdBy', 'name email')
    .sort({ caExpiryDate: 1 });

    res.json({ expiredEpiTypes });

  } catch (error) {
    console.error('Erro ao listar EPIs vencidos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar EPIs vencidos'
    });
  }
});

module.exports = router; 