import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, User, Lock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { cn } from '../utils/cn';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('email'); // 'email' or 'employee'
  const { login, loginEmployee, loading } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      if (loginType === 'email') {
        await login(data.email, data.password);
      } else {
        await loginEmployee(data.employeeId, data.password);
      }
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Checklist de EPI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Gestão de Equipamentos de Proteção Individual
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {/* Toggle de tipo de login */}
          <div className="flex rounded-md shadow-sm mb-6">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={cn(
                'flex-1 py-2 px-4 text-sm font-medium rounded-l-md border transition-colors duration-200',
                loginType === 'email'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              <Mail className="w-4 h-4 mr-2 inline" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginType('employee')}
              className={cn(
                'flex-1 py-2 px-4 text-sm font-medium rounded-r-md border-t border-r border-b transition-colors duration-200',
                loginType === 'employee'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              <User className="w-4 h-4 mr-2 inline" />
              Matrícula
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor={loginType === 'email' ? 'email' : 'employeeId'} className="block text-sm font-medium text-gray-700">
                {loginType === 'email' ? 'Email' : 'Matrícula'}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginType === 'email' ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  id={loginType === 'email' ? 'email' : 'employeeId'}
                  name={loginType === 'email' ? 'email' : 'employeeId'}
                  type={loginType === 'email' ? 'email' : 'text'}
                  autoComplete={loginType === 'email' ? 'email' : 'off'}
                  required
                  className={cn(
                    'appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
                    errors[loginType === 'email' ? 'email' : 'employeeId'] && 'input-error'
                  )}
                  placeholder={loginType === 'email' ? 'seu@email.com' : '12345'}
                  {...register(loginType === 'email' ? 'email' : 'employeeId', {
                    required: 'Campo obrigatório',
                    ...(loginType === 'email' && {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })
                  })}
                />
              </div>
              {errors[loginType === 'email' ? 'email' : 'employeeId'] && (
                <p className="mt-2 text-sm text-danger-600">
                  {errors[loginType === 'email' ? 'email' : 'employeeId'].message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={cn(
                    'appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
                    errors.password && 'input-error'
                  )}
                  placeholder="••••••••"
                  {...register('password', { required: 'Senha é obrigatória' })}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-danger-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                    </span>
                    Entrar
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Sistema de Gestão de EPI</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p>• Este sistema garante conformidade com a NR-6</p>
              <p>• Todos os dados são criptografados e seguros</p>
              <p>• Funciona offline com sincronização automática</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 