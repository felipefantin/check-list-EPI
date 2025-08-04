const mongoose = require('mongoose');

const epiTypeSchema = new mongoose.Schema({
  // Nome do tipo de EPI
  name: {
    type: String,
    required: [true, 'Nome do EPI é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  
  // Categoria do EPI (proteção para cabeça, mãos, etc.)
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    enum: [
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
    ]
  },
  
  // Descrição detalhada
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  
  // Norma técnica aplicável
  technicalStandard: {
    type: String,
    required: [true, 'Norma técnica é obrigatória'],
    trim: true
  },
  
  // Fabricante
  manufacturer: {
    type: String,
    required: [true, 'Fabricante é obrigatório'],
    trim: true
  },
  
  // Modelo
  model: {
    type: String,
    trim: true
  },
  
  // Número do CA (Certificado de Aprovação)
  caNumber: {
    type: String,
    required: [true, 'Número do CA é obrigatório'],
    trim: true,
    unique: true
  },
  
  // Data de validade do CA
  caExpiryDate: {
    type: Date,
    required: [true, 'Data de validade do CA é obrigatória']
  },
  
  // Vida útil em meses
  lifespanMonths: {
    type: Number,
    required: [true, 'Vida útil é obrigatória'],
    min: [1, 'Vida útil deve ser pelo menos 1 mês']
  },
  
  // Critérios de inspeção
  inspectionCriteria: [{
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
    }
  }],
  
  // Status do EPI
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Observações adicionais
  notes: {
    type: String,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
  },
  
  // Criado por
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices para melhor performance
epiTypeSchema.index({ name: 1 });
epiTypeSchema.index({ category: 1 });
epiTypeSchema.index({ caNumber: 1 });
epiTypeSchema.index({ isActive: 1 });
epiTypeSchema.index({ caExpiryDate: 1 });

// Método para verificar se o CA está vencido
epiTypeSchema.methods.isCAExpired = function() {
  return new Date() > this.caExpiryDate;
};

// Método para calcular dias até o vencimento do CA
epiTypeSchema.methods.daysUntilCAExpiry = function() {
  const today = new Date();
  const expiryDate = new Date(this.caExpiryDate);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Método para verificar se o CA vence em breve (30 dias)
epiTypeSchema.methods.isCAExpiringSoon = function() {
  return this.daysUntilCAExpiry() <= 30 && this.daysUntilCAExpiry() > 0;
};

// Método para retornar dados públicos
epiTypeSchema.methods.toPublicJSON = function() {
  const epiObject = this.toObject();
  return epiObject;
};

// Middleware para validar data de vencimento do CA
epiTypeSchema.pre('save', function(next) {
  if (this.caExpiryDate && this.caExpiryDate < new Date()) {
    next(new Error('Data de vencimento do CA não pode ser no passado'));
  }
  next();
});

module.exports = mongoose.model('EpiType', epiTypeSchema); 