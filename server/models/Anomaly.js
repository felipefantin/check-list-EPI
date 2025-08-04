const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
  // Execução do checklist que gerou a anomalia
  checklistExecution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChecklistExecution',
    required: true
  },
  
  // Funcionário que reportou
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tipo de EPI com problema
  epiType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EpiType',
    required: true
  },
  
  // Categoria da anomalia
  category: {
    type: String,
    enum: [
      'damage',
      'wear',
      'expired',
      'missing',
      'wrong_size',
      'contamination',
      'other'
    ],
    required: true
  },
  
  // Severidade da anomalia
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  
  // Descrição detalhada do problema
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    maxlength: [1000, 'Descrição não pode ter mais de 1000 caracteres']
  },
  
  // Local onde foi encontrado
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Local não pode ter mais de 200 caracteres']
  },
  
  // Coordenadas GPS (opcional)
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  
  // Fotos da anomalia
  photos: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      maxlength: [200, 'Descrição não pode ter mais de 200 caracteres']
    }
  }],
  
  // Status da anomalia
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  
  // Prioridade de resolução
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Data limite para resolução
  dueDate: {
    type: Date
  },
  
  // Responsável pela resolução
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Ações tomadas
  actions: [{
    action: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    takenAt: {
      type: Date,
      default: Date.now
    },
    cost: {
      type: Number,
      min: 0
    }
  }],
  
  // Resolução
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    },
    resolutionMethod: {
      type: String,
      enum: ['replacement', 'repair', 'maintenance', 'disposal', 'other'],
      trim: true
    },
    notes: {
      type: String,
      maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
    },
    cost: {
      type: Number,
      min: 0
    }
  },
  
  // Impacto na segurança
  safetyImpact: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'low'
  },
  
  // Tags para categorização
  tags: [{
    type: String,
    trim: true
  }],
  
  // Observações adicionais
  notes: {
    type: String,
    maxlength: [2000, 'Observações não podem ter mais de 2000 caracteres']
  }
}, {
  timestamps: true
});

// Índices para melhor performance
anomalySchema.index({ checklistExecution: 1 });
anomalySchema.index({ reportedBy: 1 });
anomalySchema.index({ epiType: 1 });
anomalySchema.index({ category: 1 });
anomalySchema.index({ severity: 1 });
anomalySchema.index({ status: 1 });
anomalySchema.index({ priority: 1 });
anomalySchema.index({ assignedTo: 1 });
anomalySchema.index({ dueDate: 1 });
anomalySchema.index({ createdAt: 1 });

// Método para calcular tempo de resolução
anomalySchema.methods.getResolutionTime = function() {
  if (!this.resolution || !this.resolution.resolvedAt) return null;
  
  const resolutionTime = this.resolution.resolvedAt - this.createdAt;
  return Math.round(resolutionTime / 1000 / 60 / 60); // Retorna em horas
};

// Método para verificar se está atrasada
anomalySchema.methods.isOverdue = function() {
  if (!this.dueDate || this.status === 'resolved' || this.status === 'closed') {
    return false;
  }
  
  return new Date() > this.dueDate;
};

// Método para calcular dias de atraso
anomalySchema.methods.getOverdueDays = function() {
  if (!this.isOverdue()) return 0;
  
  const overdueTime = new Date() - this.dueDate;
  return Math.ceil(overdueTime / 1000 / 60 / 60 / 24);
};

// Método para adicionar ação
anomalySchema.methods.addAction = function(action, description, takenBy, cost = 0) {
  this.actions.push({
    action,
    description,
    takenBy,
    cost
  });
  
  // Atualiza status se necessário
  if (this.status === 'open') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Método para resolver anomalia
anomalySchema.methods.resolve = function(resolvedBy, resolutionMethod, notes, cost = 0) {
  this.status = 'resolved';
  this.resolution = {
    resolvedBy,
    resolvedAt: new Date(),
    resolutionMethod,
    notes,
    cost
  };
  
  return this.save();
};

// Método para fechar anomalia
anomalySchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

// Método para calcular custo total
anomalySchema.methods.getTotalCost = function() {
  let totalCost = 0;
  
  // Soma custos das ações
  this.actions.forEach(action => {
    totalCost += action.cost || 0;
  });
  
  // Soma custo da resolução
  if (this.resolution && this.resolution.cost) {
    totalCost += this.resolution.cost;
  }
  
  return totalCost;
};

// Método para retornar dados públicos
anomalySchema.methods.toPublicJSON = function() {
  const anomalyObject = this.toObject();
  return anomalyObject;
};

// Middleware para validar dados
anomalySchema.pre('save', function(next) {
  // Validar que anomalias críticas têm prioridade alta ou urgente
  if (this.severity === 'critical' && !['high', 'urgent'].includes(this.priority)) {
    this.priority = 'urgent';
  }
  
  // Validar que anomalias críticas têm impacto alto na segurança
  if (this.severity === 'critical' && this.safetyImpact !== 'high') {
    this.safetyImpact = 'high';
  }
  
  next();
});

module.exports = mongoose.model('Anomaly', anomalySchema); 