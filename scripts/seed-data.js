const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/models/User');
const EpiType = require('../server/models/EpiType');
const Checklist = require('../server/models/Checklist');
require('dotenv').config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar:', err));

// Dados iniciais
const seedData = async () => {
  try {
    console.log('Iniciando seed de dados...');

    // Limpar dados existentes
    await User.deleteMany({});
    await EpiType.deleteMany({});
    await Checklist.deleteMany({});

    // Criar usuários
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const admin = await User.create({
      name: 'Administrador',
      email: 'admin@empresa.com',
      employeeId: 'ADM001',
      password: hashedPassword,
      role: 'admin',
      department: 'TI',
      isActive: true,
      hireDate: new Date('2024-01-01')
    });

    const safetyTech = await User.create({
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      employeeId: 'ST001',
      password: hashedPassword,
      role: 'safety_technician',
      department: 'Segurança do Trabalho',
      isActive: true,
      hireDate: new Date('2024-01-15')
    });

    const supervisor = await User.create({
      name: 'Maria Santos',
      email: 'maria.santos@empresa.com',
      employeeId: 'SUP001',
      password: hashedPassword,
      role: 'supervisor',
      department: 'Produção',
      isActive: true,
      hireDate: new Date('2024-02-01')
    });

    const employee = await User.create({
      name: 'Pedro Costa',
      email: 'pedro.costa@empresa.com',
      employeeId: 'EMP001',
      password: hashedPassword,
      role: 'employee',
      department: 'Produção',
      supervisor: supervisor._id,
      isActive: true,
      hireDate: new Date('2024-02-15')
    });

    // Atualizar supervisor com funcionário supervisionado
    await User.findByIdAndUpdate(supervisor._id, {
      supervisedEmployees: [employee._id]
    });

    // Criar tipos de EPI
    const epiTypes = await EpiType.create([
      {
        name: 'Capacete de Segurança',
        category: 'protecao_cabeca',
        description: 'Capacete de segurança industrial com ajuste regulável',
        technicalStandard: 'ABNT NBR 8221',
        manufacturer: '3M do Brasil',
        caNumber: 'CA12345',
        caExpiryDate: new Date('2025-12-31'),
        lifespanMonths: 60,
        inspectionCriteria: [
          {
            criterion: 'Integridade',
            description: 'Verificar se não há rachaduras ou danos visíveis',
            isRequired: true
          },
          {
            criterion: 'Ajuste',
            description: 'Verificar se o ajuste está correto e confortável',
            isRequired: true
          },
          {
            criterion: 'Acabamento',
            description: 'Verificar se a tinta não está descascando',
            isRequired: false
          }
        ],
        isActive: true,
        createdBy: safetyTech._id
      },
      {
        name: 'Óculos de Proteção',
        category: 'protecao_visual',
        description: 'Óculos de proteção contra impactos e radiação UV',
        technicalStandard: 'ABNT NBR 16001',
        manufacturer: 'Honeywell',
        caNumber: 'CA67890',
        caExpiryDate: new Date('2025-06-30'),
        lifespanMonths: 24,
        inspectionCriteria: [
          {
            criterion: 'Lentes',
            description: 'Verificar se não há riscos ou deformações',
            isRequired: true
          },
          {
            criterion: 'Limpeza',
            description: 'Verificar se as lentes estão limpas',
            isRequired: true
          },
          {
            criterion: 'Ajuste',
            description: 'Verificar se o ajuste está adequado',
            isRequired: true
          }
        ],
        isActive: true,
        createdBy: safetyTech._id
      },
      {
        name: 'Luvas de Proteção',
        category: 'protecao_maos',
        description: 'Luvas de proteção contra cortes e produtos químicos',
        technicalStandard: 'ABNT NBR 16577',
        manufacturer: 'Ansell',
        caNumber: 'CA11111',
        caExpiryDate: new Date('2025-12-31'),
        lifespanMonths: 12,
        inspectionCriteria: [
          {
            criterion: 'Integridade',
            description: 'Verificar se não há furos ou rasgos',
            isRequired: true
          },
          {
            criterion: 'Desgaste',
            description: 'Verificar se não há desgaste excessivo',
            isRequired: true
          },
          {
            criterion: 'Tamanho',
            description: 'Verificar se o tamanho está adequado',
            isRequired: true
          }
        ],
        isActive: true,
        createdBy: safetyTech._id
      },
      {
        name: 'Calçado de Segurança',
        category: 'protecao_pes',
        description: 'Calçado de segurança com biqueira de aço',
        technicalStandard: 'ABNT NBR 20345',
        manufacturer: 'Calçados Azaleia',
        caNumber: 'CA22222',
        caExpiryDate: new Date('2026-03-31'),
        lifespanMonths: 36,
        inspectionCriteria: [
          {
            criterion: 'Biqueira',
            description: 'Verificar se a biqueira não está amassada',
            isRequired: true
          },
          {
            criterion: 'Sola',
            description: 'Verificar se a sola não está desgastada',
            isRequired: true
          },
          {
            criterion: 'Costuras',
            description: 'Verificar se não há costuras soltas',
            isRequired: false
          }
        ],
        isActive: true,
        createdBy: safetyTech._id
      }
    ]);

    // Criar checklists
    const checklists = await Checklist.create([
      {
        name: 'Checklist Diário de EPI - Produção',
        description: 'Verificação diária dos equipamentos de proteção individual para funcionários da produção',
        type: 'daily',
        department: 'Produção',
        jobRole: 'operador',
        items: epiTypes.map((epi, index) => ({
          epiType: epi._id,
          isRequired: true,
          order: index + 1,
          criteria: epi.inspectionCriteria.map((criteria, critIndex) => ({
            criterion: criteria.criterion,
            description: criteria.description,
            isRequired: criteria.isRequired,
            order: critIndex + 1
          }))
        })),
        frequencyDays: 1,
        preferredTime: '08:00',
        isActive: true,
        version: '1.0',
        effectiveDate: new Date('2024-01-01'),
        createdBy: safetyTech._id,
        approvedBy: admin._id,
        approvedAt: new Date('2024-01-01')
      },
      {
        name: 'Checklist Semanal de EPI - Manutenção',
        description: 'Verificação semanal dos equipamentos de proteção individual para equipe de manutenção',
        type: 'weekly',
        department: 'Manutenção',
        jobRole: 'técnico',
        items: epiTypes.slice(0, 3).map((epi, index) => ({
          epiType: epi._id,
          isRequired: true,
          order: index + 1,
          criteria: epi.inspectionCriteria.map((criteria, critIndex) => ({
            criterion: criteria.criterion,
            description: criteria.description,
            isRequired: criteria.isRequired,
            order: critIndex + 1
          }))
        })),
        frequencyDays: 7,
        preferredTime: '07:30',
        isActive: true,
        version: '1.0',
        effectiveDate: new Date('2024-01-01'),
        createdBy: safetyTech._id,
        approvedBy: admin._id,
        approvedAt: new Date('2024-01-01')
      }
    ]);

    console.log('✅ Dados inseridos com sucesso!');
    console.log(`👥 Usuários criados: ${await User.countDocuments()}`);
    console.log(`🛡️ Tipos de EPI criados: ${await EpiType.countDocuments()}`);
    console.log(`📋 Checklists criados: ${await Checklist.countDocuments()}`);
    
    console.log('\n🔑 Credenciais de acesso:');
    console.log('Admin: admin@empresa.com / 123456');
    console.log('Técnico de Segurança: joao.silva@empresa.com / 123456');
    console.log('Supervisor: maria.santos@empresa.com / 123456');
    console.log('Funcionário: pedro.costa@empresa.com / 123456');

  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Conexão com MongoDB fechada');
  }
};

// Executar seed
seedData(); 