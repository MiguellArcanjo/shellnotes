import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre - Minha Aplicação Next.js",
  description: "Saiba mais sobre nossa aplicação e tecnologias utilizadas",
};

export default function Sobre() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Sobre Nossa Aplicação
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Construída com as melhores tecnologias modernas
            </p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Nossa Missão
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Esta aplicação foi desenvolvida para demonstrar o poder e a flexibilidade do 
              Next.js 16 com App Router. Utilizamos as tecnologias mais modernas para criar 
              uma experiência de usuário excepcional.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tecnologias Principais
            </h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-6">
              <li><strong>Next.js 16:</strong> Framework React com App Router e Server Components</li>
              <li><strong>TypeScript:</strong> Tipagem estática para desenvolvimento mais seguro</li>
              <li><strong>Tailwind CSS:</strong> Framework CSS utilitário para design responsivo</li>
              <li><strong>React 19:</strong> Biblioteca de interface de usuário mais recente</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Funcionalidades
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Server Components
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Renderização no servidor para melhor performance e SEO
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  App Router
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sistema de roteamento moderno baseado em arquivos
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Design Responsivo
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Interface adaptável para todos os tamanhos de tela
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Modo Escuro
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Suporte completo para tema claro e escuro
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <a
              href="/"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 mr-4"
            >
              Voltar ao Início
            </a>
            <a
              href="/contato"
              className="inline-block border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Entre em Contato
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}