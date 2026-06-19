'use client';

import { useState } from 'react';

interface ApiResponse {
  mensagem: string;
  timestamp: string;
  status: string;
  dadosRecebidos?: any;
}

export default function ApiDemo() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');

  const handleGetRequest = async () => {
    setLoading(true);
    try {
      const url = nome 
        ? `/api/hello?nome=${encodeURIComponent(nome)}`
        : '/api/hello';
      
      const res = await fetch(url);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Erro na requisição:', error);
      setResponse({
        mensagem: 'Erro ao conectar com a API',
        status: 'error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome || 'Usuário Anônimo',
          acao: 'teste POST',
          timestamp: new Date().toISOString()
        }),
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Erro na requisição POST:', error);
      setResponse({
        mensagem: 'Erro ao conectar com a API',
        status: 'error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
      <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
        ⚡ Client Component + API Routes
      </h3>
      <p className="text-green-700 dark:text-green-300 mb-4">
        Este componente roda no cliente e faz chamadas para nossa API Route.
      </p>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Nome (opcional):
          </label>
          <input
            type="text"
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            placeholder="Digite seu nome..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGetRequest}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? 'Carregando...' : 'Requisição GET'}
          </button>
          
          <button
            onClick={handlePostRequest}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? 'Carregando...' : 'Requisição POST'}
          </button>
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Resposta da API:
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                response.status === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {response.status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(response.timestamp).toLocaleString('pt-BR')}
              </span>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              {response.mensagem}
            </p>
            
            {response.dadosRecebidos && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Dados enviados:
                </p>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(response.dadosRecebidos, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded border-l-4 border-green-500">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>Dica:</strong> Este componente usa 'use client' e pode acessar APIs do browser como fetch, useState, etc.
          A API Route está em <code className="bg-green-200 dark:bg-green-800 px-1 rounded">/api/hello</code>
        </p>
      </div>
    </div>
  );
}