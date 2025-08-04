const mongoose = require('mongoose');

const checklistExecutionSchema = new mongoose.Schema({
  // Checklist executado
  checklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    required: true
  },
  
  // Funcionário que executou
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Supervisor (se aplicável)
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Data e hora de início da execução
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Data e hora de conclusão
  completedAt: {
    type: Date
  },
  
  // Status da execução
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled', 'pending_approval', 'approved', 'rejected'],
    default: 'in_progress'
  },
  
  // Resultados dos itens
  results: [{
    // Item do checklist
    checklistItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    
    // Tipo de EPI
    epiType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EpiType',
      required: true
    },
    
    // Status do item
    status: {
      type: String,
      enum: ['ok', 'not_conform', 'not_applicable', 'pending'],
      required: true
    },
    
    // Resultados dos critérios
    criteriaResults: [{
      criterion: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['ok', 'not_conform', 'not_applicable'],
        required: true
      },
      notes: {
        type: String,
        maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
      }
    }],
    
    // Observações gerais do item
    notes: {
      type: String,
      maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
    },
    
    // Fotos do item (se houver anomalias)
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
    
    // Timestamp da verificação
    checkedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Observações gerais da execução
  generalNotes: {
    type: String,
    maxlength: [2000, 'Observações não podem ter mais de 2000 caracteres']
  },
  
  // Local onde foi executado
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
  
  // Assinatura digital (hash da assinatura)
  digitalSignature: {
    hash: {
      type: String,
      required: function() {
        return this.status === 'completed';
      }
    },
    signedAt: {
      type: Date
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  
  // Aprovação (se necessário)
  approval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    notes: {
      type: String,
      maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
    }
  },
  
  // Sincronização offline
  sync: {
    isOffline: {
      type: Boolean,
      default: false
    },
    syncedAt: {
      type: Date
    },
    syncAttempts: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Índices para melhor performance
checklistExecutionSchema.index({ checklist: 1 });
checklistExecutionSchema.index({ employee: 1 });
checklistExecutionSchema.index({ supervisor: 1 });
checklistExecutionSchema.index({ status: 1 });
checklistExecutionSchema.index({ startedAt: 1 });
checklistExecutionSchema.index({ completedAt: 1 });
checklistExecutionSchema.index({ 'sync.isOffline': 1 });

// Método para calcular duração da execução
checklistExecutionSchema.methods.getDuration = function() {
  if (!this.completedAt) return null;
  
  const duration = this.completedAt - this.startedAt;
  return Math.round(duration / 1000 / 60); // Retorna em minutos
};

// Método para verificar se há itens não conformes
checklistExecutionSchema.methods.hasNonConformItems = function() {
  return this.results.some(result => result.status === 'not_conform');
};

// Método para contar itens por status
checklistExecutionSchema.methods.getStatusCount = function() {
  const counts = {
    ok: 0,
    not_conform: 0,
    not_applicable: 0,
    pending: 0
  };
  
  this.results.forEach(result => {
    counts[result.status]++;
  });
  
  return counts;
};

// Método para calcular percentual de conformidade
checklistExecutionSchema.methods.getCompliancePercentage = function() {
  const counts = this.getStatusCount();
  const total = counts.ok + counts.not_conform + counts.not_applicable;
  
  if (total === 0) return 0;
  
  return Math.round((counts.ok / total) * 100);
};

// Método para finalizar execução
checklistExecutionSchema.methods.complete = function(signatureHash, ipAddress, userAgent) {
  this.status = 'completed';
  this.completedAt = new Date();
  
  if (signatureHash) {
    this.digitalSignature = {
      hash: signatureHash,
      signedAt: new Date(),
      ipAddress,
      userAgent
    };
  }
  
  return this.save();
};

// Método para aprovar execução
checklistExecutionSchema.methods.approve = function(approvedBy, notes) {
  this.status = 'approved';
  this.approval = {
    approvedBy,
    approvedAt: new Date(),
    notes
  };
  
  return this.save();
};

// Método para rejeitar execução
checklistExecutionSchema.methods.reject = function(approvedBy, notes) {
  this.status = 'rejected';
  this.approval = {
    approvedBy,
    approvedAt: new Date(),
    notes
  };
  
  return this.save();
};

// Método para retornar dados públicos
checklistExecutionSchema.methods.toPublicJSON = function() {
  const executionObject = this.toObject();
  return executionObject;
};

// Middleware para validar dados
checklistExecutionSchema.pre('save', function(next) {
  // Validar que todos os itens obrigatórios foram verificados
  if (this.status === 'completed') {
    const pendingItems = this.results.filter(result => result.status === 'pending');
    if (pendingItems.length > 0) {
      next(new Error('Todos os itens obrigatórios devem ser verificados antes de finalizar'));
    }
  }
  
  next();
});

module.exports = mongoose.model('ChecklistExecution', checklistExecutionSchema); 