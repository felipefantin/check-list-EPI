const express = require('express');
const { body, validationResult } = require('express-validator');
const ChecklistExecution = require('../models/ChecklistExecution');
const { 
  authenticateToken, 
  requireEmployee,
  canAccessUserData 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/executions
// @desc    Listar execuções de checklist
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      checklist,
      employee,
      startDate,
      endDate
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (status) filters.status = status;
    if (checklist) filters.checklist = checklist;
    if (startDate || endDate) {
      filters.startedAt = {};
      if (startDate) filters.startedAt.$gte = new Date(startDate);
      if (endDate) filters.startedAt.$lte = new Date(endDate);
    }

    // Filtrar por usuário se não for admin ou técnico de segurança
    if (!['admin', 'safety_technician'].includes(req.user.role)) {
      if (req.user.role === 'supervisor') {
        // Supervisores veem execuções da sua equipe
        filters.employee = { $in: req.user.supervisedEmployees };
      } else {
        // Funcionários veem apenas suas próprias execuções
        filters.employee = req.user._id;
      }
    } else if (employee) {
      filters.employee = employee;
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Buscar execuções
    const executions = await ChecklistExecution.find(filters)
      .populate('checklist', 'name description')
      .populate('employee', 'name email')
      .populate('supervisor', 'name email')
      .populate('epiType', 'name category')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total
    const total = await ChecklistExecution.countDocuments(filters);

    res.json({
      executions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar execuções:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao listar execuções'
    });
  }
});

// @route   GET /api/executions/:id
// @desc    Obter execução específica
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const execution = await ChecklistExecution.findById(req.params.id)
      .populate('checklist', 'name description items')
      .populate('employee', 'name email')
      .populate('supervisor', 'name email')
      .populate('epiType', 'name category description');

    if (!execution) {
      return res.status(404).json({
        error: 'Execução não encontrada'
      });
    }

    // Verificar permissões
    if (!canAccessUserData(req, res, () => {})) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar esta execução'
      });
    }

    res.json({ execution });

  } catch (error) {
    console.error('Erro ao obter execução:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao obter execução'
    });
  }
});

// @route   POST /api/executions
// @desc    Criar nova execução
// @access  Private (Employee)
router.post('/', [
  authenticateToken,
  requireEmployee,
  body('checklist', 'Checklist é obrigatório').notEmpty(),
  body('results', 'Resultados são obrigatórios').isArray({ min: 1 })
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
      checklist, 
      results, 
      generalNotes, 
      location,
      coordinates 
    } = req.body;

    // Criar execução
    const executionData = {
      checklist,
      employee: req.user._id,
      results,
      startedAt: new Date()
    };

    if (req.user.supervisor) executionData.supervisor = req.user.supervisor;
    if (generalNotes) executionData.generalNotes = generalNotes;
    if (location) executionData.location = location;
    if (coordinates) executionData.coordinates = coordinates;

    const execution = new ChecklistExecution(executionData);
    await execution.save();

    // Popular dados para retorno
    await execution.populate([
      { path: 'checklist', select: 'name description' },
      { path: 'employee', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Execução criada com sucesso',
      execution: execution.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao criar execução:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao criar execução'
    });
  }
});

// @route   PUT /api/executions/:id
// @desc    Atualizar execução
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('results', 'Resultados são obrigatórios').isArray({ min: 1 })
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
      results, 
      generalNotes, 
      location,
      coordinates 
    } = req.body;

    // Buscar execução
    const execution = await ChecklistExecution.findById(req.params.id);
    if (!execution) {
      return res.status(404).json({
        error: 'Execução não encontrada'
      });
    }

    // Verificar permissões
    if (execution.employee.toString() !== req.user._id.toString() && 
        !['admin', 'safety_technician'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para editar esta execução'
      });
    }

    // Atualizar execução
    const updateData = { results };

    if (generalNotes !== undefined) updateData.generalNotes = generalNotes;
    if (location !== undefined) updateData.location = location;
    if (coordinates !== undefined) updateData.coordinates = coordinates;

    const updatedExecution = await ChecklistExecution.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('checklist', 'name description')
    .populate('employee', 'name email');

    res.json({
      message: 'Execução atualizada com sucesso',
      execution: updatedExecution.toPublicJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar execução:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao atualizar execução'
    });
  }
});

// @route   POST /api/executions/:id/complete
// @desc    Finalizar execução
// @access  Private
router.post('/:id/complete', [
  authenticateToken,
  body('signatureHash', 'Assinatura é obrigatória').notEmpty()
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

    const { signatureHash } = req.body;

    // Buscar execução
    const execution = await ChecklistExecution.findById(req.params.id);
    if (!execution) {
      return res.status(404).json({
        error: 'Execução não encontrada'
      });
    }

    // Verificar permissões
    if (execution.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para finalizar esta execução'
      });
    }

    // Finalizar execução
    await execution.complete(signatureHash, req.ip, req.get('User-Agent'));

    res.json({
      message: 'Execução finalizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao finalizar execução:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao finalizar execução'
    });
  }
});

module.exports = router; 