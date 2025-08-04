import React from 'react';
import { CheckSquare, Play } from 'lucide-react';

const Executions = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Execuções</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visualize e gerencie execuções de checklist
          </p>
        </div>
        <button className="btn-primary">
          <Play className="h-4 w-4 mr-2" />
          Nova Execução
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Execuções de Checklist
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

export default Executions; 