const express = require('express');
const ChecklistExecution = require('../models/ChecklistExecution');
const Anomaly = require('../models/Anomaly');
const User = require('../models/User');
const EpiType = require('../models/EpiType');
const { authenticateToken, requireSupervisor } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Obter dados do dashboard
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Estatísticas básicas
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalEpiTypes = await EpiType.countDocuments({ isActive: true });
    
    // Execuções de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalExecutions = await ChecklistExecution.countDocuments({
      startedAt: { $gte: today }
    });

    // Anomalias abertas
    const openAnomalies = await Anomaly.countDocuments({
      status: { $in: ['open', 'in_progress'] }
    });

    // Taxa de conformidade (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentExecutions = await ChecklistExecution.find({
      startedAt: { $gte: thirtyDaysAgo },
      status: 'completed'
    });

    let totalItems = 0;
    let conformItems = 0;

    recentExecutions.forEach(execution => {
      execution.results.forEach(result => {
        totalItems++;
        if (result.status === 'ok') {
          conformItems++;
        }
      });
    });

    const complianceRate = totalItems > 0 ? Math.round((conformItems / totalItems) * 100) : 0;

    // Execuções pendentes
    const pendingExecutions = await ChecklistExecution.countDocuments({
      status: 'in_progress'
    });

    // EPIs vencendo em breve (30 dias)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringEpiTypes = await EpiType.countDocuments({
      caExpiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      isActive: true
    });

    // Atividades recentes
    const recentActivities = await ChecklistExecution.find({
      startedAt: { $gte: thirtyDaysAgo }
    })
    .populate('employee', 'name')
    .populate('checklist', 'name')
    .sort({ startedAt: -1 })
    .limit(10)
    .lean();

    const activities = recentActivities.map(execution => ({
      id: execution._id,
      type: 'execution',
      description: `${execution.employee?.name || 'Usuário'} executou ${execution.checklist?.name || 'checklist'}`,
      date: execution.startedAt
    }));

    res.json({
      stats: {
        totalUsers,
        totalEpiTypes,
        totalExecutions,
        openAnomalies,
        complianceRate,
        pendingExecutions,
        expiringEpiTypes,
        complianceChange: 5 // Placeholder
      },
      recentActivities: activities
    });

  } catch (error) {
    console.error('Erro ao obter dados do dashboard:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao obter dados do dashboard'
    });
  }
});

// @route   GET /api/reports/compliance
// @desc    Relatório de conformidade
// @access  Private
router.get('/compliance', [authenticateToken, requireSupervisor], async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Construir filtros
    const filters = {
      status: 'completed'
    };

    if (startDate || endDate) {
      filters.startedAt = {};
      if (startDate) filters.startedAt.$gte = new Date(startDate);
      if (endDate) filters.startedAt.$lte = new Date(endDate);
    }

    // Filtrar por departamento se especificado
    if (department && req.user.role !== 'admin') {
      // Buscar usuários do departamento
      const departmentUsers = await User.find({ department }).select('_id');
      filters.employee = { $in: departmentUsers.map(u => u._id) };
    }

    const executions = await ChecklistExecution.find(filters)
      .populate('employee', 'name department')
      .populate('checklist', 'name')
      .sort({ startedAt: -1 });

    // Calcular estatísticas
    let totalItems = 0;
    let conformItems = 0;
    let nonConformItems = 0;
    let notApplicableItems = 0;

    executions.forEach(execution => {
      execution.results.forEach(result => {
        totalItems++;
        switch (result.status) {
          case 'ok':
            conformItems++;
            break;
          case 'not_conform':
            nonConformItems++;
            break;
          case 'not_applicable':
            notApplicableItems++;
            break;
        }
      });
    });

    const complianceRate = totalItems > 0 ? Math.round((conformItems / totalItems) * 100) : 0;

    res.json({
      executions,
      statistics: {
        totalItems,
        conformItems,
        nonConformItems,
        notApplicableItems,
        complianceRate
      }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de conformidade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao gerar relatório de conformidade'
    });
  }
});

// @route   GET /api/reports/anomalies
// @desc    Relatório de anomalias
// @access  Private
router.get('/anomalies', [authenticateToken, requireSupervisor], async (req, res) => {
  try {
    const { startDate, endDate, status, severity, category } = req.query;

    // Construir filtros
    const filters = {};

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (category) filters.category = category;

    const anomalies = await Anomaly.find(filters)
      .populate('reportedBy', 'name department')
      .populate('epiType', 'name category')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    // Calcular estatísticas
    const stats = {
      total: anomalies.length,
      open: anomalies.filter(a => a.status === 'open').length,
      inProgress: anomalies.filter(a => a.status === 'in_progress').length,
      resolved: anomalies.filter(a => a.status === 'resolved').length,
      closed: anomalies.filter(a => a.status === 'closed').length,
      bySeverity: {
        low: anomalies.filter(a => a.severity === 'low').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        high: anomalies.filter(a => a.severity === 'high').length,
        critical: anomalies.filter(a => a.severity === 'critical').length
      },
      byCategory: {
        damage: anomalies.filter(a => a.category === 'damage').length,
        wear: anomalies.filter(a => a.category === 'wear').length,
        expired: anomalies.filter(a => a.category === 'expired').length,
        missing: anomalies.filter(a => a.category === 'missing').length,
        wrong_size: anomalies.filter(a => a.category === 'wrong_size').length,
        contamination: anomalies.filter(a => a.category === 'contamination').length,
        other: anomalies.filter(a => a.category === 'other').length
      }
    };

    res.json({
      anomalies,
      statistics: stats
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de anomalias:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao gerar relatório de anomalias'
    });
  }
});

// @route   GET /api/reports/executions
// @desc    Relatório de execuções
// @access  Private
router.get('/executions', [authenticateToken, requireSupervisor], async (req, res) => {
  try {
    const { startDate, endDate, status, checklist, employee } = req.query;

    // Construir filtros
    const filters = {};

    if (startDate || endDate) {
      filters.startedAt = {};
      if (startDate) filters.startedAt.$gte = new Date(startDate);
      if (endDate) filters.startedAt.$lte = new Date(endDate);
    }

    if (status) filters.status = status;
    if (checklist) filters.checklist = checklist;
    if (employee) filters.employee = employee;

    const executions = await ChecklistExecution.find(filters)
      .populate('employee', 'name department')
      .populate('checklist', 'name description')
      .populate('supervisor', 'name')
      .sort({ startedAt: -1 });

    // Calcular estatísticas
    const stats = {
      total: executions.length,
      completed: executions.filter(e => e.status === 'completed').length,
      inProgress: executions.filter(e => e.status === 'in_progress').length,
      cancelled: executions.filter(e => e.status === 'cancelled').length,
      pendingApproval: executions.filter(e => e.status === 'pending_approval').length,
      approved: executions.filter(e => e.status === 'approved').length,
      rejected: executions.filter(e => e.status === 'rejected').length
    };

    res.json({
      executions,
      statistics: stats
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de execuções:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao gerar relatório de execuções'
    });
  }
});

// @route   GET /api/reports/epi-status
// @desc    Relatório de status dos EPIs
// @access  Private
router.get('/epi-status', [authenticateToken, requireSupervisor], async (req, res) => {
  try {
    const epiTypes = await EpiType.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ name: 1 });

    // Calcular estatísticas
    const stats = {
      total: epiTypes.length,
      active: epiTypes.filter(e => e.isActive).length,
      expired: epiTypes.filter(e => e.isCAExpired()).length,
      expiringSoon: epiTypes.filter(e => e.isCAExpiringSoon()).length,
      byCategory: {}
    };

    // Contar por categoria
    epiTypes.forEach(epi => {
      if (!stats.byCategory[epi.category]) {
        stats.byCategory[epi.category] = 0;
      }
      stats.byCategory[epi.category]++;
    });

    res.json({
      epiTypes,
      statistics: stats
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de status dos EPIs:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao gerar relatório de status dos EPIs'
    });
  }
});

module.exports = router; 