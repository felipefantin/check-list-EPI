const express = require('express');
const { body, validationResult } = require('express-validator');
const Anomaly = require('../models/Anomaly');
const { 
  authenticateToken, 
  requireSupervisor,
  canAccessUserData 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/anomalies
// @desc    Listar anomalias
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      severity,
      category,
      epiType,
      startDate,
      endDate
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (category) filters.category = category;
    if (epiType) filters.epiType = epiType;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Filtrar por usuário se não for admin ou técnico de segurança
    if (!['admin', 'safety_technician'].includes(req.user.role)) {
      if (req.user.role === 'supervisor') {
        // Supervisores veem anomalias da sua equipe
        filters.reportedBy = { $in: req.user.supervisedEmployees };
      } else {
        // Funcionários veem apenas suas próprias anomalias
        filters.reportedBy = req.user._id;
      }
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Buscar anomalias
    const anomalies = await Anomaly.find(filters)
      .populate('checklistExecution', 'startedAt completedAt')
      .populate('reportedBy', 'name email')
      .populate('epiType', 'name category')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total
    const total = await Anomaly.countDocuments(filters);

    res.json({
      anomalies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar anomalias:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar anomalias'
    });
  }
});

// @route   GET /api/anomalies/:id
// @desc    Obter anomalia específica
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const anomaly = await Anomaly.findById(req.params.id)
      .populate('checklistExecution', 'startedAt completedAt')
      .populate('reportedBy', 'name email')
      .populate('epiType', 'name category description')
      .populate('assignedTo', 'name email')
      .populate('actions.takenBy', 'name email')
      .populate('resolution.resolvedBy', 'name email');

    if (!anomaly) {
      return res.status(404).json({
        error: 'Anomalia não encontrada'
      });
    }

    // Verificar permissões
    if (!canAccessUserData(req, res, () => {})) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar esta anomalia'
      });
    }

    res.json({ anomaly });

  } catch (error) {
    console.error('Erro ao obter anomalia:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao obter anomalia'
    });
  }
});

// @route   POST /api/anomalies
// @desc    Criar nova anomalia
// @access  Private
router.post('/', [
  authenticateToken,
  body('checklistExecution', 'Execução do checklist é obrigatória').notEmpty(),
  body('epiType', 'Tipo de EPI é obrigatório').notEmpty(),
  body('category', 'Categoria é obrigatória').isIn(['damage', 'wear', 'expired', 'missing', 'wrong_size', 'contamination', 'other']),
  body('severity', 'Severidade é obrigatória').isIn(['low', 'medium', 'high', 'critical']),
  body('description', 'Descrição é obrigatória').notEmpty().trim()
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
      checklistExecution, 
      epiType, 
      category, 
      severity, 
      description,
      location,
      coordinates,
      photos,
      tags,
      notes 
    } = req.body;

    // Criar anomalia
    const anomalyData = {
      checklistExecution,
      reportedBy: req.user._id,
      epiType,
      category,
      severity,
      description
    };

    if (location) anomalyData.location = location;
    if (coordinates) anomalyData.coordinates = coordinates;
    if (photos) anomalyData.photos = photos;
    if (tags) anomalyData.tags = tags;
    if (notes) anomalyData.notes = notes;

    const anomaly = new Anomaly(anomalyData);
    await anomaly.save();

    // Popular dados para retorno
    await anomaly.populate([
      { path: 'checklistExecution', select: 'startedAt' },
      { path: 'reportedBy', select: 'name email' },
      { path: 'epiType', select: 'name category' }
    ]);

    res.status(201).json({
      message: 'Anomalia criada com sucesso',
      anomaly: anomaly.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao criar anomalia:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao criar anomalia'
    });
  }
});

// @route   PUT /api/anomalies/:id
// @desc    Atualizar anomalia
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('category', 'Categoria é obrigatória').isIn(['damage', 'wear', 'expired', 'missing', 'wrong_size', 'contamination', 'other']),
  body('severity', 'Severidade é obrigatória').isIn(['low', 'medium', 'high', 'critical'])
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
      category, 
      severity, 
      description,
      location,
      coordinates,
      photos,
      tags,
      notes,
      assignedTo,
      dueDate,
      priority
    } = req.body;

    // Buscar anomalia
    const anomaly = await Anomaly.findById(req.params.id);
    if (!anomaly) {
      return res.status(404).json({
        error: 'Anomalia não encontrada'
      });
    }

    // Verificar permissões
    if (anomaly.reportedBy.toString() !== req.user._id.toString() && 
        !['admin', 'safety_technician'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para editar esta anomalia'
      });
    }

    // Atualizar anomalia
    const updateData = { category, severity };

    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (coordinates !== undefined) updateData.coordinates = coordinates;
    if (photos !== undefined) updateData.photos = photos;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (priority !== undefined) updateData.priority = priority;

    const updatedAnomaly = await Anomaly.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('reportedBy', 'name email')
    .populate('epiType', 'name category');

    res.json({
      message: 'Anomalia atualizada com sucesso',
      anomaly: updatedAnomaly.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar anomalia:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao atualizar anomalia'
    });
  }
});

// @route   POST /api/anomalies/:id/actions
// @desc    Adicionar ação à anomalia
// @access  Private
router.post('/:id/actions', [
  authenticateToken,
  body('action', 'Ação é obrigatória').notEmpty().trim(),
  body('description', 'Descrição é obrigatória').notEmpty().trim()
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

    const { action, description, cost } = req.body;

    // Buscar anomalia
    const anomaly = await Anomaly.findById(req.params.id);
    if (!anomaly) {
      return res.status(404).json({
        error: 'Anomalia não encontrada'
      });
    }

    // Adicionar ação
    await anomaly.addAction(action, description, req.user._id, cost || 0);

    res.json({
      message: 'Ação adicionada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao adicionar ação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao adicionar ação'
    });
  }
});

// @route   POST /api/anomalies/:id/resolve
// @desc    Resolver anomalia
// @access  Private
router.post('/:id/resolve', [
  authenticateToken,
  body('resolutionMethod', 'Método de resolução é obrigatório').isIn(['replacement', 'repair', 'maintenance', 'disposal', 'other']),
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

    const { resolutionMethod, notes, cost } = req.body;

    // Buscar anomalia
    const anomaly = await Anomaly.findById(req.params.id);
    if (!anomaly) {
      return res.status(404).json({
        error: 'Anomalia não encontrada'
      });
    }

    // Resolver anomalia
    await anomaly.resolve(req.user._id, resolutionMethod, notes, cost || 0);

    res.json({
      message: 'Anomalia resolvida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao resolver anomalia:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao resolver anomalia'
    });
  }
});

module.exports = router; 