import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nome = searchParams.get('nome') || 'Visitante';

  return NextResponse.json({
    mensagem: `Olá, ${nome}! Bem-vindo à nossa API.`,
    timestamp: new Date().toISOString(),
    status: 'success'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      mensagem: 'Dados recebidos com sucesso!',
      dadosRecebidos: body,
      timestamp: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        erro: 'Erro ao processar dados',
        status: 'error' 
      },
      { status: 400 }
    );
  }
}