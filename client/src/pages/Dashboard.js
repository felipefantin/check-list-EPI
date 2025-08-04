import React from 'react';
import { useQuery } from 'react-query';
import { 
  Users, 
  Shield, 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ title, value, change, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change > 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {change > 0 ? (
                      <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      <TrendingDown className="self-center flex-shrink-0 h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {change > 0 ? 'Aumentou' : 'Diminuiu'} em
                    </span>
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentActivity = ({ activities = [] }) => (
  <div className="bg-white shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
        Atividades Recentes
      </h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, index) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {index !== activities.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      activity.type === 'execution' ? 'bg-success-500' :
                      activity.type === 'anomaly' ? 'bg-warning-500' :
                      'bg-primary-500'
                    }`}>
                      {activity.type === 'execution' ? (
                        <CheckSquare className="h-4 w-4 text-white" />
                      ) : activity.type === 'anomaly' ? (
                        <AlertTriangle className="h-4 w-4 text-white" />
                      ) : (
                        <Users className="h-4 w-4 text-white" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={activity.date}>
                        {new Date(activity.date).toLocaleDateString('pt-BR')}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const QuickActions = ({ user }) => {
  const actions = [
    {
      name: 'Executar Checklist',
      description: 'Iniciar verificação de EPIs',
      href: '/executions',
      icon: CheckSquare,
      color: 'primary'
    },
    {
      name: 'Reportar Anomalia',
      description: 'Registrar problema encontrado',
      href: '/anomalies',
      icon: AlertTriangle,
      color: 'warning'
    }
  ];

  // Adicionar ações específicas por role
  if (['safety_technician', 'admin'].includes(user?.role)) {
    actions.push(
      {
        name: 'Gerenciar EPIs',
        description: 'Cadastrar ou editar tipos de EPI',
        href: '/epi-types',
        icon: Shield,
        color: 'success'
      },
      {
        name: 'Criar Checklist',
        description: 'Definir nova verificação',
        href: '/checklists',
        icon: Calendar,
        color: 'primary'
      }
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              primary: 'bg-primary-50 text-primary-600 hover:bg-primary-100',
              success: 'bg-success-50 text-success-600 hover:bg-success-100',
              warning: 'bg-warning-50 text-warning-600 hover:bg-warning-100',
              danger: 'bg-danger-50 text-danger-600 hover:bg-danger-100'
            };

            return (
              <a
                key={action.name}
                href={action.href}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 transition-colors duration-200"
              >
                <div className={`flex-shrink-0 p-2 rounded-md ${colorClasses[action.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">
                    {action.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    reportsAPI.getDashboard,
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Erro ao carregar dashboard
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Não foi possível carregar os dados do dashboard.
        </p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    totalEpiTypes: 0,
    totalExecutions: 0,
    totalAnomalies: 0,
    complianceRate: 0,
    pendingExecutions: 0,
    openAnomalies: 0,
    expiringEpiTypes: 0
  };

  const activities = dashboardData?.recentActivities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Visão geral do sistema de checklist de EPI
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Usuários"
          value={stats.totalUsers}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Tipos de EPI"
          value={stats.totalEpiTypes}
          icon={Shield}
          color="success"
        />
        <StatCard
          title="Execuções Hoje"
          value={stats.totalExecutions}
          icon={CheckSquare}
          color="primary"
        />
        <StatCard
          title="Anomalias Abertas"
          value={stats.openAnomalies}
          icon={AlertTriangle}
          color="warning"
        />
      </div>

      {/* Cards de métricas importantes */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Taxa de Conformidade"
          value={`${stats.complianceRate}%`}
          change={stats.complianceChange}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Execuções Pendentes"
          value={stats.pendingExecutions}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="EPIs Vencendo"
          value={stats.expiringEpiTypes}
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActions user={user} />
        <RecentActivity activities={activities} />
      </div>

      {/* Informações adicionais */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Informações do Sistema
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Departamento</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.department || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Função</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {user?.role?.replace('_', ' ') || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Último Login</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.lastLogin 
                  ? new Date(user.lastLogin).toLocaleString('pt-BR')
                  : 'N/A'
                }
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 