import React from 'react';
import { Users as UsersIcon, Plus } from 'lucide-react';

const Users = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie usuários e permissões do sistema</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Funcionalidade em Desenvolvimento</h3>
              <p className="text-sm">A página de gerenciamento de usuários está sendo implementada.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users; 