import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';

const Anomalies = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anomalias</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie anomalias reportadas nos EPIs
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Anomalia
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Gestão de Anomalias
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

export default Anomalies; 