const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  // Nome do checklist
  name: {
    type: String,
    required: [true, 'Nome do checklist é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  
  // Descrição do checklist
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  
  // Tipo de checklist (diário, semanal, mensal, etc.)
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on_demand'],
    default: 'daily',
    required: true
  },
  
  // Departamento/Setor específico (opcional - se null, aplica a todos)
  department: {
    type: String,
    trim: true
  },
  
  // Função/Cargo específico (opcional - se null, aplica a todos)
  jobRole: {
    type: String,
    trim: true
  },
  
  // Itens do checklist
  items: [{
    epiType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EpiType',
      required: true
    },
    
    // Critérios específicos para este item
    criteria: [{
      criterion: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        required: true,
        trim: true
      },
      isRequired: {
        type: Boolean,
        default: true
      },
      order: {
        type: Number,
        default: 0
      }
    }],
    
    // Se o item é obrigatório
    isRequired: {
      type: Boolean,
      default: true
    },
    
    // Ordem de exibição
    order: {
      type: Number,
      default: 0
    },
    
    // Observações específicas para este item
    notes: {
      type: String,
      maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
    }
  }],
  
  // Frequência de execução (em dias)
  frequencyDays: {
    type: Number,
    default: 1,
    min: [1, 'Frequência deve ser pelo menos 1 dia']
  },
  
  // Horário preferencial para execução
  preferredTime: {
    type: String,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)']
  },
  
  // Status do checklist
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Versão do checklist
  version: {
    type: Number,
    default: 1
  },
  
  // Data de início da vigência
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  
  // Data de fim da vigência (opcional)
  expiryDate: {
    type: Date
  },
  
  // Criado por
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Aprovado por
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Data de aprovação
  approvedAt: {
    type: Date
  },
  
  // Observações gerais
  notes: {
    type: String,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
  }
}, {
  timestamps: true
});

// Índices para melhor performance
checklistSchema.index({ name: 1 });
checklistSchema.index({ type: 1 });
checklistSchema.index({ department: 1 });
checklistSchema.index({ jobRole: 1 });
checklistSchema.index({ isActive: 1 });
checklistSchema.index({ effectiveDate: 1 });
checklistSchema.index({ expiryDate: 1 });

// Método para verificar se o checklist está vigente
checklistSchema.methods.isEffective = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.effectiveDate && 
         (!this.expiryDate || now <= this.expiryDate);
};

// Método para verificar se o checklist se aplica a um usuário
checklistSchema.methods.appliesToUser = function(user) {
  // Verifica se está vigente
  if (!this.isEffective()) return false;
  
  // Verifica departamento
  if (this.department && this.department !== user.department) return false;
  
  // Verifica função (se implementado no futuro)
  if (this.jobRole && this.jobRole !== user.jobRole) return false;
  
  return true;
};

// Método para calcular próxima execução
checklistSchema.methods.getNextExecutionDate = function(lastExecutionDate) {
  if (!lastExecutionDate) {
    return new Date();
  }
  
  const nextDate = new Date(lastExecutionDate);
  nextDate.setDate(nextDate.getDate() + this.frequencyDays);
  return nextDate;
};

// Método para retornar dados públicos
checklistSchema.methods.toPublicJSON = function() {
  const checklistObject = this.toObject();
  return checklistObject;
};

// Middleware para validar datas
checklistSchema.pre('save', function(next) {
  if (this.expiryDate && this.expiryDate <= this.effectiveDate) {
    next(new Error('Data de fim deve ser posterior à data de início'));
  }
  next();
});

module.exports = mongoose.model('Checklist', checklistSchema); 