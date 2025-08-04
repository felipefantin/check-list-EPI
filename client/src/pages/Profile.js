import React from 'react';
import { User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas informações pessoais
          </p>
        </div>
        <button className="btn-secondary">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Perfil do Usuário
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Funcionalidade em desenvolvimento
            </p>
            
            {/* Informações básicas do usuário */}
            <div className="mt-6 text-left max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Função</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {user?.role?.replace('_', ' ') || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Departamento</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.department || 'N/A'}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 