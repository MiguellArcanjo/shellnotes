import type { Metadata } from "next";
import ApiDemo from "@/components/ApiDemo";

export const metadata: Metadata = {
  title: "Demo - Funcionalidades Avançadas",
  description: "Demonstração de Server Components, Client Components e API Routes",
};

// Server Component - roda no servidor
async function ServerData() {
  // Simular uma chamada de API no servidor
  const timestamp = new Date().toLocaleString('pt-BR');
  
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
        🔧 Server Component
      </h3>
      <p className="text-blue-700 dark:text-blue-300 mb-2">
        Este componente é renderizado no servidor durante o build/request.
      </p>
      <div className="bg-white dark:bg-gray-800 p-3 rounded border">
        <code className="text-sm">
          Renderizado em: {timestamp}
        </code>
      </div>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Demonstração Técnica
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Server Components, Client Components e API Routes em ação
            </p>
          </div>

          {/* Content Grid */}
          <div className="space-y-8">
            {/* Server Component Demo */}
            <ServerData />

            {/* Client Component Demo */}
            <ApiDemo />

            {/* Features Overview */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Recursos Demonstrados
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Next.js 16 Features
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>App Router com layout aninhado</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Server Components (RSC)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Client Components com 'use client'</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>API Routes no App Router</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Metadata API para SEO</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Tecnologias Integradas
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>TypeScript 5+ para tipagem</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>Tailwind CSS 4 para estilos</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>ESLint para qualidade de código</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>Turbopack para bundling</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>React 19 com novos hooks</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="text-center">
              <a
                href="/"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Voltar ao Início
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}