'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Link2,
  UserCheck,
  Camera,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Shield,
  Cloud,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Layers,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ProjetoData {
  id: string | number;
  nome?: string | null;
  nome_projeto?: string | null;
  local?: string | null;
  modalidade?: string | null;
  gerente_projeto?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  horas_semanais?: number | string | null;
  quantidade_turmas?: number | null;
  verba?: number | string | null;
  verba_gasta?: number | string | null;
  status?: string | null;
}

interface CardItem {
  id: string;
  titulo: string;
  descricao: string;
  icone: React.ElementType;
  badges: string[];
  categoria: 'operacional' | 'gestao' | 'midia';
  destaqueCor: 'blue' | 'red';
}

const CARDS_GESTAO: CardItem[] = [
  {
    id: 'link-inscricao',
    titulo: 'Gerar Link de Inscrição',
    descricao: 'Crie e compartilhe links dinâmicos para a inscrição de novos participantes.',
    icone: Link2,
    badges: ['Admin', 'Gerente'],
    categoria: 'operacional',
    destaqueCor: 'blue',
  },
  {
    id: 'lista-presenca',
    titulo: 'Lista de Presença',
    descricao: 'Controle diário de frequência das turmas e registro de presença dos alunos.',
    icone: UserCheck,
    badges: ['Admin', 'Gerente', 'Professores'],
    categoria: 'operacional',
    destaqueCor: 'red',
  },
  {
    id: 'fotos-treino',
    titulo: 'Fotos do Treino',
    descricao: 'Galeria fotográfica de atividades, treinos e eventos para prestação de contas.',
    icone: Camera,
    badges: ['Admin', 'Gerente', 'Professores'],
    categoria: 'midia',
    destaqueCor: 'blue',
  },
  {
    id: 'inscricoes-alunos',
    titulo: 'Inscrições de Alunos',
    descricao: 'Visualize, aprove ou edite cadastros de alunos inscritos no projeto.',
    icone: Users,
    badges: ['Admin', 'Gerente', 'Professores'],
    categoria: 'operacional',
    destaqueCor: 'red',
  },
  {
    id: 'contratos',
    titulo: 'Contratos',
    descricao: 'Área para anexar, revisar e auditar minutas e contratos vinculados ao projeto.',
    icone: FileText,
    badges: ['Admin', 'Gerente'],
    categoria: 'gestao',
    destaqueCor: 'blue',
  },
  {
    id: 'presenca-mensal',
    titulo: 'Presença Mensal',
    descricao: 'Consolidação e anexo das folhas mensais assinadas para comprovação oficial.',
    icone: Calendar,
    badges: ['Admin', 'Gerente', 'Professores'],
    categoria: 'operacional',
    destaqueCor: 'red',
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    descricao: 'Acompanhamento orçamentário, controle de notas, repasses e saldos da verba.',
    icone: DollarSign,
    badges: ['Admin', 'Gerente'],
    categoria: 'gestao',
    destaqueCor: 'blue',
  },
  {
    id: 'equipe-projeto',
    titulo: 'Equipe do Projeto',
    descricao: 'Gestão de professores, estagiários e permissões de usuários vinculados.',
    icone: Shield,
    badges: ['Admin', 'Gerente'],
    categoria: 'gestao',
    destaqueCor: 'red',
  },
  {
    id: 'acesso-drive',
    titulo: 'Acesso ao Drive',
    descricao: 'Repositório na nuvem com relatórios, documentos institucionais e arquivos gerais.',
    icone: Cloud,
    badges: ['Admin', 'Gerente'],
    categoria: 'gestao',
    destaqueCor: 'blue',
  },
];

function GestaoProjetoContent() {
  const params = useParams();
  const idProjeto = params?.id as string | undefined;

  // Gerenciamento de Tema Claro/Escuro consistente com o Dashboard
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [cardAtivoAviso, setCardAtivoAviso] = useState<string | null>(null);

  // Estados dos dados reais do projeto vindo do Supabase
  const [projeto, setProjeto] = useState<ProjetoData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  useEffect(() => {
    const temaSalvo = localStorage.getItem('liespe_theme');
    if (temaSalvo === 'light') {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(true);
    }
  }, []);

  // Busca dos dados reais do projeto no Supabase
  useEffect(() => {
    async function carregarProjeto() {
      if (!idProjeto) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErroCarregamento(null);
      try {
        const { data, error } = await supabase
          .from('projetos')
          .select('*')
          .eq('id', idProjeto)
          .single();

        if (error) {
          console.error('Erro ao buscar projeto no Supabase:', error.message);
          setErroCarregamento(error.message);
        } else if (data) {
          setProjeto(data as ProjetoData);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha na conexão com o banco de dados.';
        console.error('Erro inesperado ao carregar projeto:', msg);
        setErroCarregamento(msg);
      } finally {
        setIsLoading(false);
      }
    }

    carregarProjeto();
  }, [idProjeto]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;
      localStorage.setItem('liespe_theme', nextTheme ? 'dark' : 'light');
      return nextTheme;
    });
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'admin':
        return isDarkMode
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          : 'bg-rose-50 text-rose-700 border-rose-200';
      case 'gerente':
        return isDarkMode
          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
          : 'bg-blue-50 text-blue-700 border-blue-200';
      case 'professores':
        return isDarkMode
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return isDarkMode
          ? 'bg-slate-800 text-slate-300 border-slate-700'
          : 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleCardClick = (card: CardItem) => {
    setCardAtivoAviso(card.titulo);
    setTimeout(() => {
      setCardAtivoAviso(null);
    }, 3000);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-red-600 selection:text-white ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. Cabeçalho Superior */}
      <header
        className={`h-20 px-6 sm:px-10 border-b backdrop-blur-md flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 ${
          isDarkMode
            ? 'border-slate-800/80 bg-slate-900/75'
            : 'border-slate-200 bg-white/85 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Botão Voltar */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all group ${
              isDarkMode
                ? 'border-slate-700/80 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800'
                : 'border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-red-500" />
            <span>Voltar ao Painel</span>
          </Link>

          <div
            className={`h-7 w-px hidden sm:block ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />

          {/* Logótipo Liespe */}
          <div className="relative h-10 w-32 hidden md:block">
            <Image
              src="/Logo - Liespe.png"
              alt="Logo Liespe"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
        </div>

        {/* Controles do Cabeçalho */}
        <div className="flex items-center gap-3">
          {/* Alternância de Modo Claro/Escuro */}
          <button
            onClick={toggleTheme}
            title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            aria-label="Alternar tema"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDarkMode
                ? 'border-slate-700/80 bg-slate-800/80 text-amber-400 hover:text-amber-300 hover:bg-slate-800 hover:border-slate-600 shadow-sm'
                : 'border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400 shadow-sm'
            }`}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Status do Projeto no Topo Direito */}
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              (projeto?.status || '').toLowerCase().includes('conclu')
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : (projeto?.status || '').toLowerCase().includes('cancel')
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                : (projeto?.status || '').toLowerCase().includes('iniciar')
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {projeto?.status || 'Em andamento'}
          </span>
        </div>
      </header>

      {/* 2. Área de Título do Projeto e Breadcrumb */}
      <div
        className={`px-6 sm:px-10 py-8 border-b transition-colors duration-200 ${
          isDarkMode
            ? 'bg-slate-900/40 border-slate-800/70'
            : 'bg-white/60 border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link href="/dashboard" className="hover:text-red-500 transition-colors">
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-500">Projetos</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>
              Gestão Interna
            </span>
          </div>

          {isLoading ? (
            /* Estado de Carregando com texto e spinner solicitado */
            <div className="py-6 flex items-center gap-3">
              <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
              <div>
                <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Carregando detalhes do projeto...
                </p>
                <p className="text-xs text-slate-400">
                  Buscando dados em tempo real no banco de dados Supabase
                </p>
              </div>
            </div>
          ) : erroCarregamento ? (
            /* Estado de Erro no Carregamento */
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-red-500">Erro ao carregar projeto</h2>
                <p className="text-xs text-slate-400">{erroCarregamento}</p>
              </div>
            </div>
          ) : (
            /* Cabeçalho Dinâmico com Dados Reais do Supabase */
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-9 rounded-full bg-gradient-to-b from-red-600 to-blue-600 shrink-0" />
                  <h1
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Gestão do Projeto: {projeto?.nome_projeto || projeto?.nome || 'Projeto Sem Nome'}
                  </h1>
                </div>

                {/* Subtítulo dinâmico: Modalidade, Núcleo/Local e Gerente */}
                <div
                  className={`mt-2.5 flex items-center gap-3 sm:gap-6 flex-wrap text-xs sm:text-sm pl-5.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-red-500 shrink-0" />
                    <span>
                      Modalidade:{' '}
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>
                        {projeto?.modalidade || 'A definir'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Núcleo:{' '}
                      <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>
                        {projeto?.local || 'A definir'}
                      </strong>
                    </span>
                  </div>

                  {projeto?.gerente_projeto && (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        Gerente:{' '}
                        <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>
                          {projeto.gerente_projeto}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Conteúdo Principal - Grelha de 9 Cards Clicáveis */}
      <main className="flex-1 px-6 sm:px-10 py-10 max-w-7xl mx-auto w-full space-y-8">
        {/* Banner de Feedback Interativo ao Clicar */}
        {cardAtivoAviso && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/15 via-blue-600/15 to-transparent border border-red-500/30 flex items-center gap-3 animate-in slide-in-from-top-3 duration-200">
            <Sparkles className="w-5 h-5 text-red-500 shrink-0" />
            <div className="text-xs sm:text-sm">
              <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                {cardAtivoAviso}
              </strong>
              <span className={isDarkMode ? 'text-slate-300 ml-1.5' : 'text-slate-700 ml-1.5'}>
                — Módulo selecionado. Em breve estará totalmente integrado com a navegação de dados do sistema!
              </span>
            </div>
          </div>
        )}

        {/* Grid de 9 Cards Modernos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARDS_GESTAO.map((card) => {
            const Icone = card.icone;
            const isRed = card.destaqueCor === 'red';

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isDarkMode
                    ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-300/50 hover:-translate-y-1'
                }`}
              >
                {/* Linha de acento no topo com gradiente Liespe no hover */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 transition-opacity duration-300 ${
                    isRed
                      ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 opacity-60 group-hover:opacity-100'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-60 group-hover:opacity-100'
                  }`}
                />

                {/* Brilho decorativo sutil de fundo no hover */}
                <div
                  className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-30 ${
                    isRed ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                />

                <div className="space-y-4">
                  {/* Ícone e Indicador de Clique */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md ${
                        isRed
                          ? isDarkMode
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30 group-hover:bg-red-600 group-hover:text-white shadow-red-500/10'
                            : 'bg-red-50 text-red-600 border border-red-200 group-hover:bg-red-600 group-hover:text-white shadow-red-600/15'
                          : isDarkMode
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white shadow-blue-500/10'
                          : 'bg-blue-50 text-blue-600 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white shadow-blue-600/15'
                      }`}
                    >
                      <Icone className="w-6 h-6 stroke-[2]" />
                    </div>

                    <div
                      className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 ${
                        isDarkMode
                          ? 'text-slate-400 group-hover:text-white bg-slate-800'
                          : 'text-slate-500 group-hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Título e Descrição */}
                  <div>
                    <h3
                      className={`text-lg font-bold transition-colors ${
                        isDarkMode
                          ? 'text-white group-hover:text-red-400'
                          : 'text-slate-900 group-hover:text-red-600'
                      }`}
                    >
                      {card.titulo}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {card.descricao}
                    </p>
                  </div>
                </div>

                {/* Rodapé do Card com as Badges de Nível de Acesso */}
                <div
                  className={`mt-6 pt-4 border-t flex flex-col gap-2 transition-colors duration-200 ${
                    isDarkMode ? 'border-slate-800/80' : 'border-slate-100'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Acesso Permitido
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {card.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${getBadgeStyle(
                          badge
                        )}`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé informativo */}
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs transition-colors ${
            isDarkMode
              ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
              : 'bg-white border-slate-200 text-slate-600 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              As permissões de acesso são validadas de acordo com a função do usuário autenticado no sistema Liespe.
            </span>
          </div>

          <Link
            href="/dashboard"
            className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <span>Retornar aos Projetos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function GestaoProjetoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400">Carregando gestão do projeto...</span>
          </div>
        </div>
      }
    >
      <GestaoProjetoContent />
    </Suspense>
  );
}
