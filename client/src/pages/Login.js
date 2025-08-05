import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.js'; // Alterado aqui
import LoadingSpinner from '../components/LoadingSpinner.js'; // Alterado aqui
import { Mail, User, Lock, Shield } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  // Mantemos o estado da aba ativa para controlar qual formulário é exibido
  const [activeTab, setActiveTab] = useState('email'); // 'email' ou 'employeeId'
  // Removemos o estado 'error' aqui, pois o AuthContext já lida com as mensagens de erro via toast.
  // const [error, setError] = useState(null); 
  const navigate = useNavigate();
  // Importamos as funções de login do AuthContext
  const { login, loginEmployee } = useContext(AuthContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
    // Adicionamos 'reset' para limpar o formulário após a troca de abas ou submissão
    reset, 
  } = useForm();

  // Função onSubmit corrigida e melhorada
  const onSubmit = async (data) => {
    // Não precisamos mais limpar o erro aqui se o AuthContext gerencia o toast
    // setError(null); 
    setLoading(true);
    let result; // Variável para armazenar o resultado do login

    try {
      if (activeTab === 'email') {
        // Chamamos a função de login por e-mail
        result = await login({ email: data.email, password: data.password });
      } else {
        // Chamamos a função de login por matrícula
        result = await loginEmployee({ employeeId: data.employeeId, password: data.password });
      }

      // Verificamos o resultado da operação de login
      if (result.success) {
        navigate('/dashboard'); // Redireciona apenas se o login foi bem-sucedido
      } else {
        // Se o login falhou, o AuthContext já exibiu um toast de erro.
        // Podemos, opcionalmente, logar o erro para depuração.
        console.error('Falha no login:', result.error);
        // Se você ABSOLUTAMENTE precisar de uma mensagem de erro específica no componente,
        // poderia reativar o setError(result.error) aqui, mas o toast já faz o trabalho.
      }
    } catch (err) {
      // Este catch só será acionado se houver um erro inesperado que não foi tratado
      // pelo AuthContext (ex: problema de rede antes da requisição ser enviada).
      // O AuthContext já tem um tratamento de erro robusto, então este catch é mais um fallback.
      console.error('Erro inesperado no login:', err);
      // Se quiser exibir um toast genérico para erros inesperados aqui:
      // toast.error('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false); // Sempre desativa o spinner de carregamento
    }
  };

  // Função para lidar com a troca de abas
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    reset(); // Limpa os campos do formulário ao trocar de aba para evitar dados de uma aba na outra
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Checklist de EPI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para continuar
          </p>
        </div>

        {/* --- Abas de seleção --- */}
        <div className="mb-4 flex border-b">
          <button
            onClick={() => handleTabChange('email')} // Usa a nova função
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'email' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Acesso por Email
          </button>
          <button
            onClick={() => handleTabChange('employeeId')} // Usa a nova função
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'employeeId' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Acesso por Matrícula
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* --- Campo de Email ou Matrícula --- */}
            {activeTab === 'email' ? (
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    // O 'required' é condicional, o que é ótimo
                    {...register('email', { required: activeTab === 'email' ? 'Email é obrigatório.' : false })}
                    placeholder="seu@email.com"
                    className="w-full rounded-md border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {/* Exibe o erro do react-hook-form */}
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="employeeId" className="sr-only">Matrícula</label>
                <div className="relative">
                   <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="employeeId"
                    type="text"
                    // O 'required' é condicional, o que é ótimo
                    {...register('employeeId', { required: activeTab === 'employeeId' ? 'Matrícula é obrigatória.' : false })}
                    placeholder="Sua matrícula"
                    className="w-full rounded-md border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {/* Exibe o erro do react-hook-form */}
                {errors.employeeId && <p className="mt-1 text-xs text-red-600">{errors.employeeId.message}</p>}
              </div>
            )}
            
            {/* --- Campo de Senha --- */}
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="password"
                  type="password"
                  {...register('password', { required: 'Senha é obrigatória.' })}
                  placeholder="********"
                  className="w-full rounded-md border-gray-300 py-2 pl-10 pr-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {/* Exibe o erro do react-hook-form */}
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {/* --- Mensagem de Erro (remover se o toast for suficiente) --- */}
            {/* Se você removeu o estado 'error' acima, pode remover este bloco */}
            {/* {error && (
              <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">
                {error}
              </p>
            )} */}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                 {/* CORRIGIDO O AVISO DO LINK: Usando um botão para evitar problemas de navegação sem router */}
                <button type="button" className="font-medium text-blue-600 hover:text-blue-500">
                  Esqueceu a senha?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
