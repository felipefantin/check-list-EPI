const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Informações básicas
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  
  // Matrícula para login dos funcionários
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [20, 'Matrícula não pode ter mais de 20 caracteres']
  },
  
  // Senha criptografada
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
  },
  
  // Nível de acesso
  role: {
    type: String,
    enum: ['employee', 'supervisor', 'safety_technician', 'admin'],
    default: 'employee',
    required: true
  },
  
  // Departamento/Setor
  department: {
    type: String,
    required: [true, 'Departamento é obrigatório'],
    trim: true
  },
  
  // Supervisor (para funcionários)
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role === 'employee';
    }
  },
  
  // Funcionários supervisionados (para supervisores)
  supervisedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Status do usuário
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Data de contratação
  hireDate: {
    type: Date,
    default: Date.now
  },
  
  // Último login
  lastLogin: {
    type: Date
  },
  
  // Foto do usuário (opcional)
  photo: {
    type: String
  }
}, {
  timestamps: true
});

// Índices para melhor performance
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ supervisor: 1 });

// Middleware para criptografar senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só criptografa se a senha foi modificada
  if (!this.isModified('password')) return next();
  
  try {
    // Gera salt e criptografa a senha
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para retornar dados públicos do usuário
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Método para verificar permissões
userSchema.methods.hasPermission = function(permission) {
  const permissions = {
    employee: ['read_own_checklists', 'create_checklist_execution'],
    supervisor: ['read_own_checklists', 'read_team_checklists', 'approve_checklists', 'create_checklist_execution'],
    safety_technician: ['read_all_checklists', 'manage_epi_types', 'manage_checklists', 'generate_reports', 'create_checklist_execution'],
    admin: ['all']
  };
  
  return permissions[this.role].includes(permission) || permissions[this.role].includes('all');
};

// Método para atualizar último login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 