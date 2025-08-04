import React from 'react';
import { Shield, Plus } from 'lucide-react';

const EpiTypes = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de EPI</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie tipos de equipamentos de proteção individual
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo de EPI
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Gestão de Tipos de EPI
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpiTypes; 