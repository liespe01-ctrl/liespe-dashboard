'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  Plus,
  Sun,
  Moon,
  FileText,
  Search,
  LogOut,
  ChevronRight,
  Clock,
  TrendingUp,
  Sparkles,
  MoreVertical,
  X,
  Building2,
  Calendar,
  Layers,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Wallet,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { STATUS_VALIDOS, StatusProjeto, isStatusValido } from '@/lib/status';

interface Projeto {
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
  status?: StatusProjeto | string | null;
  created_at?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuAbertoId, setMenuAbertoId] = useState<string | number | null>(null);

  // Estados dos projetos reais do Supabase
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);

  // Função para buscar projetos reais do Supabase com sincronização automática de status
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar projetos do Supabase:', error.message);
      } else if (data) {
        // Data atual (hoje) no formato YYYY-MM-DD
        const hojeStr = new Date().toISOString().slice(0, 10);

        // Mapeia e atualiza projetos que devem transitar de 'A iniciar' para 'Em andamento'
        const projetosSincronizados = await Promise.all(
          data.map(async (proj: Projeto) => {
            const statusOriginal = (proj.status || '').trim();
            const dataInicio = proj.data_inicio ? proj.data_inicio.slice(0, 10) : null;

            // Se o status for 'A iniciar' E hoje >= data_inicio
            const isAIniciar = statusOriginal.toLowerCase() === 'a iniciar';
            const jaIniciou = Boolean(dataInicio && hojeStr >= dataInicio);

            if (isAIniciar && jaIniciou) {
              const novoStatus: StatusProjeto = 'Em andamento';

              // Validação 1: O novo status está em STATUS_VALIDOS?
              if (!isStatusValido(novoStatus)) {
                console.warn(
                  `[Aviso de Validação] Status "${novoStatus}" para o projeto id=${proj.id} não é válido. Update ignorado.`
                );
                return proj;
              }

              // Validação 2: O novo status é diferente do status atual?
              if (proj.status === novoStatus) {
                return proj;
              }

              console.log(
                `Projeto "${proj.nome_projeto || proj.nome}" (id: ${proj.id}) atingiu a data de início (${dataInicio}). Atualizando status de "${proj.status}" para "${novoStatus}"...`
              );

              // Dispara atualização no Supabase com valor exato aceito pela constraint
              try {
                const { error: updateError } = await supabase
                  .from('projetos')
                  .update({ status: novoStatus })
                  .eq('id', proj.id);

                if (updateError) {
                  console.error(
                    `Erro ao atualizar status do projeto ${proj.id} para "${novoStatus}" no Supabase:`,
                    updateError.message
                  );
                }
              } catch (err) {
                console.error(
                  `Erro inesperado ao atualizar status do projeto ${proj.id} para "${novoStatus}":`,
                  err
                );
              }

              // Retorna o projeto com o novo status refletido no frontend
              return { ...proj, status: novoStatus };
            }

            return proj;
          })
        );

        setProjects(projetosSincronizados);
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar projetos:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Estados dos Filtros
  const [periodoTipo, setPeriodoTipo] = useState<'todos' | 'mes' | 'ano' | 'personalizado'>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [filtroAno, setFiltroAno] = useState<string>('');
  const [dataInicioPersonalizada, setDataInicioPersonalizada] = useState<string>('');
  const [dataFimPersonalizada, setDataFimPersonalizada] = useState<string>('');
  const [buscaNome, setBuscaNome] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Estado do Modo Claro/Escuro (persistido em localStorage)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    fetchProjects();
    const now = new Date();
    setFiltroMes(now.toISOString().slice(0, 7));
    setFiltroAno(now.getFullYear().toString());

    // Carrega tema preferido salvo
    const temaSalvo = localStorage.getItem('liespe_theme');
    if (temaSalvo === 'light') {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(true);
    }
  }, []);

  // Estado para controlar qual projeto está com o dropdown de status aberto
  const [statusDropdownId, setStatusDropdownId] = useState<string | number | null>(null);
  const [statusAtualizandoId, setStatusAtualizandoId] = useState<string | number | null>(null);

  // Função para atualizar o status do projeto no frontend e no Supabase
  const handleUpdateStatus = async (projetoId: string | number, novoStatus: StatusProjeto) => {
    setStatusDropdownId(null);
    setStatusAtualizandoId(projetoId);

    // Salva cópia anterior para rollback se houver falha
    const projetoAnterior = projects.find((p) => p.id === projetoId);
    const statusAnterior = projetoAnterior?.status;

    // Atualização otimista imediata na interface
    setProjects((prev) =>
      prev.map((p) => (p.id === projetoId ? { ...p, status: novoStatus } : p))
    );

    try {
      const { error } = await supabase
        .from('projetos')
        .update({ status: novoStatus })
        .eq('id', projetoId);

      if (error) {
        console.error(`Erro ao atualizar status do projeto ${projetoId} no Supabase:`, error.message);
        // Reverte alteração se falhar
        setProjects((prev) =>
          prev.map((p) => (p.id === projetoId ? { ...p, status: statusAnterior } : p))
        );
        alert(`Não foi possível salvar o novo status: ${error.message}`);
      } else {
        setToastMessage(`Status atualizado para "${novoStatus}" com sucesso!`);
      }
    } catch (err) {
      console.error('Erro inesperado ao atualizar status:', err);
      setProjects((prev) =>
        prev.map((p) => (p.id === projetoId ? { ...p, status: statusAnterior } : p))
      );
      alert('Erro inesperado ao conectar com o banco de dados.');
    } finally {
      setStatusAtualizandoId(null);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;
      localStorage.setItem('liespe_theme', nextTheme ? 'dark' : 'light');
      return nextTheme;
    });
  };

  // Filtragem dinâmica dos projetos
  const filteredProjects = projects.filter((proj) => {
    // 1. Tratamento e normalização do status padrão ('Em andamento' se vazio)
    const statusAtual = (proj.status || 'Em andamento').trim();
    if (filtroStatus !== 'todos') {
      if (statusAtual.toLowerCase() !== filtroStatus.toLowerCase()) {
        return false;
      }
    }

    // 2. Busca por nome do projeto
    if (buscaNome.trim()) {
      const termo = buscaNome.toLowerCase();
      const nomeCompleto = (proj.nome_projeto || proj.nome || '').toLowerCase();
      const modalidade = (proj.modalidade || '').toLowerCase();
      const gerente = (proj.gerente_projeto || '').toLowerCase();
      if (!nomeCompleto.includes(termo) && !modalidade.includes(termo) && !gerente.includes(termo)) {
        return false;
      }
    }

    // 3. Filtro por Período
    const dataRef = proj.data_inicio || proj.created_at || proj.data_fim;
    if (periodoTipo === 'mes' && filtroMes && dataRef) {
      if (!dataRef.startsWith(filtroMes)) {
        return false;
      }
    } else if (periodoTipo === 'ano' && filtroAno && dataRef) {
      if (!dataRef.startsWith(filtroAno)) {
        return false;
      }
    } else if (periodoTipo === 'personalizado') {
      if (dataInicioPersonalizada && dataRef && dataRef < dataInicioPersonalizada) {
        return false;
      }
      if (dataFimPersonalizada && dataRef && dataRef > dataFimPersonalizada) {
        return false;
      }
    }

    return true;
  });

  // Cálculo reativo dos 8 indicadores com valores padrão para dados nulos
  const totalProjetos = filteredProjects.length;

  const projetosEmAndamento = filteredProjects.filter((p) => {
    const s = (p.status || 'Em andamento').toLowerCase();
    return s.includes('andamento') || s.includes('progresso') || s.includes('iniciado') || s.includes('novo');
  }).length;

  const projetosAIniciar = filteredProjects.filter((p) => {
    const s = (p.status || '').toLowerCase();
    return s.includes('a iniciar') || s === 'planejado';
  }).length;

  const projetosConcluidos = filteredProjects.filter((p) => {
    const s = (p.status || '').toLowerCase();
    return s.includes('conclu') || s.includes('finaliz');
  }).length;

  const totalTurmas = filteredProjects.reduce(
    (acc, p) => acc + (Number(p.quantidade_turmas) || 0),
    0
  );

  const verbaTotal = filteredProjects.reduce((acc, p) => {
    const v = typeof p.verba === 'number' ? p.verba : Number(p.verba) || 0;
    return acc + v;
  }, 0);

  const verbaGasta = filteredProjects.reduce((acc, p) => {
    const vg = typeof p.verba_gasta === 'number' ? p.verba_gasta : Number(p.verba_gasta) || 0;
    return acc + vg;
  }, 0);

  const saldo = verbaTotal - verbaGasta;

  // Estados do formulário e submissão
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [local, setLocal] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [gerenteProjeto, setGerenteProjeto] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horasSemanais, setHorasSemanais] = useState('');
  const [qtdTurmas, setQtdTurmas] = useState('');
  const [verba, setVerba] = useState('');

  // Estados de feedback e carregamento
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const resetForm = () => {
    setNomeProjeto('');
    setLocal('');
    setModalidade('');
    setGerenteProjeto('');
    setDataInicio('');
    setDataFim('');
    setHorasSemanais('');
    setQtdTurmas('');
    setVerba('');
    setModalError(null);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      // Função auxiliar para sanitizar valores numéricos (inclusive strings com R$, vírgulas ou pontos)
      const parseNumeric = (val: string | number): number | null => {
        if (val === null || val === undefined) return null;
        if (typeof val === 'number') return isNaN(val) ? null : val;
        const clean = val.replace(/[^\d.,-]/g, '').replace(',', '.');
        if (!clean.trim()) return null;
        const num = Number(clean);
        return isNaN(num) ? null : num;
      };

      const nomeFormatado = nomeProjeto.trim();

      const payload = {
        nome: nomeFormatado,
        nome_projeto: nomeFormatado,
        local: local.trim() || null,
        modalidade: modalidade.trim() || null,
        gerente_projeto: gerenteProjeto.trim() || null,
        data_inicio: dataInicio ? dataInicio : null,
        data_fim: dataFim ? dataFim : null,
        horas_semanais: parseNumeric(horasSemanais),
        quantidade_turmas: qtdTurmas ? (Number(qtdTurmas) || 0) : null,
        verba: parseNumeric(verba),
      };

      console.log('Enviando dados do projeto para Supabase:', payload);

      const { data, error } = await supabase.from('projetos').insert([payload]).select();

      if (error) {
        console.error('Supabase Error Message:', error.message);
        console.error('Supabase Error Details:', error.details);
        console.error('Supabase Error Hint:', error.hint);
        console.error('Supabase Full Error:', error);
        throw error;
      }

      console.log('Projeto inserido com sucesso:', data);

      if (data && data[0]) {
        setProjects((prev) => [data[0], ...prev]);
      } else {
        fetchProjects();
      }

      // Fecha o modal e limpa o formulário
      resetForm();
      setIsModalOpen(false);

      // Exibe notificação de sucesso
      setToastMessage('Projeto registado com sucesso no Supabase!');
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    } catch (err: unknown) {
      console.error('Erro capturado ao inserir projeto:', err);
      // Se tiver propriedades do PostgrestError (message e details)
      const pgError = err as { message?: string; details?: string; hint?: string };
      if (pgError?.message) {
        console.error('error.message:', pgError.message);
        if (pgError.details) {
          console.error('error.details:', pgError.details);
        }
        setModalError(
          `Erro ao salvar: ${pgError.message}${pgError.details ? ` (${pgError.details})` : ''}`
        );
      } else if (err instanceof Error) {
        console.error('error.message:', err.message);
        setModalError(`Erro ao salvar projeto: ${err.message}`);
      } else {
        setModalError('Ocorreu um erro ao conectar com o Supabase. Verifique a tabela e permissões.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 selection:bg-red-600 selection:text-white ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. Menu Lateral (Sidebar) com tema Liespe (Azul Escuro / Vermelho) */}
      <aside
        className={`w-64 border-r backdrop-blur-xl flex flex-col shrink-0 transition-colors duration-200 ${
          isDarkMode
            ? 'border-slate-800/80 bg-slate-900/80'
            : 'border-slate-200 bg-white/90 shadow-sm'
        }`}
      >
        {/* Logótipo Liespe no topo da Sidebar */}
        <div
          className={`h-20 flex items-center px-6 border-b transition-colors duration-200 ${
            isDarkMode ? 'border-slate-800/80 bg-slate-900/90' : 'border-slate-200 bg-white'
          }`}
        >
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative h-11 w-36">
              <Image
                src="/Logo - Liespe.png"
                alt="Logo Liespe"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>
        </div>

        {/* Itens de Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/25 font-semibold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('projetos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'projetos'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/25 font-semibold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Projetos</span>
          </button>

          <button
            onClick={() => setActiveTab('documentos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'documentos'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/25 font-semibold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Controle de Documentos</span>
          </button>

          <button
            onClick={() => setActiveTab('equipe')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'equipe'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/25 font-semibold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipe</span>
          </button>
        </nav>

        {/* Cartão de Utilizador e Logout */}
        <div
          className={`p-4 border-t transition-colors duration-200 ${
            isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
              isDarkMode
                ? 'bg-slate-800/50 border-slate-800/80'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-red-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-red-600/20 shrink-0">
                GL
              </div>
              <div className="overflow-hidden">
                <p
                  className={`text-sm font-medium truncate ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  Gestor Liespe
                </p>
                <p
                  className={`text-xs truncate ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  admin@liespe.com
                </p>
              </div>
            </div>
            <Link
              href="/login"
              title="Terminar sessão"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* 2. Área Central de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho Superior com o Logótipo Liespe */}
        <header
          className={`h-20 px-8 border-b backdrop-blur-md flex items-center justify-between sticky top-0 z-20 transition-colors duration-200 ${
            isDarkMode
              ? 'border-slate-800/80 bg-slate-900/60'
              : 'border-slate-200 bg-white/80 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-44">
              <Image
                src="/Logo - Liespe.png"
                alt="Logo - Liespe"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
            <div
              className={`h-8 w-px hidden md:block ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            />
            <p
              className={`text-xs hidden md:block ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Painel Integrado de Gestão e Acompanhamento de Projetos
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Barra de Pesquisa */}
            <div className="relative w-64 hidden sm:block">
              <Search
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-400'
                }`}
              />
              <input
                type="text"
                placeholder="Pesquisar projetos..."
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isDarkMode
                    ? 'bg-slate-800/80 border-slate-700/60 text-white placeholder:text-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Alternância de Modo Claro/Escuro (Light/Dark Mode) */}
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

            {/* Botão em destaque: 'Novo Projeto' com cores do logotipo */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Projeto</span>
            </button>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-8 overflow-y-auto space-y-8">
          {/* BARRA DE FILTROS RESPONSIVA */}
          <div
            className={`rounded-2xl p-5 shadow-sm backdrop-blur-md border transition-colors duration-200 ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-red-500" />
              <h2
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDarkMode ? 'text-white' : 'text-slate-800'
                }`}
              >
                Filtros Gerenciais
              </h2>
              {(buscaNome || filtroStatus !== 'todos' || periodoTipo !== 'todos') && (
                <button
                  onClick={() => {
                    setBuscaNome('');
                    setFiltroStatus('todos');
                    setPeriodoTipo('todos');
                    setDataInicioPersonalizada('');
                    setDataFimPersonalizada('');
                  }}
                  className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Busca por Nome do Projeto */}
              <div>
                <label
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Buscar por Projeto
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={buscaNome}
                    onChange={(e) => setBuscaNome(e.target.value)}
                    placeholder="Nome, modalidade ou gerente..."
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700/70 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  {buscaNome && (
                    <button
                      onClick={() => setBuscaNome('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Seletor de Status do Projeto */}
              <div>
                <label
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Status do Projeto
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-800/90 border-slate-700/70 text-white [color-scheme:dark]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light]'
                  }`}
                >
                  <option value="todos">Todos os Status</option>
                  {STATUS_VALIDOS.map((st) => (
                    <option key={st} value={st.toLowerCase()}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Seletor de Período (Mês, Ano, Personalizado, Todos) */}
              <div>
                <label
                  className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Período
                </label>
                <div className="flex gap-2">
                  <select
                    value={periodoTipo}
                    onChange={(e) => setPeriodoTipo(e.target.value as 'todos' | 'mes' | 'ano' | 'personalizado')}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700/70 text-white [color-scheme:dark]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light]'
                    }`}
                  >
                    <option value="todos">Todo o Período</option>
                    <option value="mes">Por Mês</option>
                    <option value="ano">Por Ano</option>
                    <option value="personalizado">Personalizado</option>
                  </select>

                  {/* Sub-controles condicionais de período */}
                  {periodoTipo === 'mes' && (
                    <input
                      type="month"
                      value={filtroMes}
                      onChange={(e) => setFiltroMes(e.target.value)}
                      className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        isDarkMode
                          ? 'bg-slate-800/90 border-slate-700/70 text-white [color-scheme:dark]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light]'
                      }`}
                    />
                  )}

                  {periodoTipo === 'ano' && (
                    <input
                      type="number"
                      min="2000"
                      max="2099"
                      value={filtroAno}
                      onChange={(e) => setFiltroAno(e.target.value)}
                      className={`w-24 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        isDarkMode
                          ? 'bg-slate-800/90 border-slate-700/70 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Inputs de período personalizado */}
            {periodoTipo === 'personalizado' && (
              <div
                className={`mt-3 pt-3 border-t flex flex-wrap items-center gap-3 ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-xs">De:</span>
                <input
                  type="date"
                  value={dataInicioPersonalizada}
                  onChange={(e) => setDataInicioPersonalizada(e.target.value)}
                  className={`px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light]'
                  }`}
                />
                <span className="text-xs">Até:</span>
                <input
                  type="date"
                  value={dataFimPersonalizada}
                  onChange={(e) => setDataFimPersonalizada(e.target.value)}
                  className={`px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white [color-scheme:dark]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light]'
                  }`}
                />
              </div>
            )}
          </div>

          {/* NOVO GRID COM 8 CAIXAS (CARDS) GERENCIAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total de Projetos */}
            <div
              className={`p-5 rounded-2xl border relative overflow-hidden group transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-800 hover:border-blue-500/30'
                  : 'bg-white border-slate-200 hover:border-blue-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Total de Projetos
                  </p>
                  <p
                    className={`text-2xl font-extrabold mt-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {totalProjetos}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <FolderKanban className="w-5 h-5" />
                </div>
              </div>
              <p
                className={`mt-3 text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {projects.length} no total da base
              </p>
            </div>

            {/* Card 2: Projetos em Andamento */}
            <div
              className={`p-5 rounded-2xl border relative overflow-hidden group transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-800 hover:border-amber-500/30'
                  : 'bg-white border-slate-200 hover:border-amber-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
                    Em Andamento
                  </p>
                  <p
                    className={`text-2xl font-extrabold mt-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {projetosEmAndamento}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p
                className={`mt-3 text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Atividades em execução
              </p>
            </div>

            {/* Card 3: Projetos Concluídos */}
            <div
              className={`p-5 rounded-2xl border relative overflow-hidden group transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/30'
                  : 'bg-white border-slate-200 hover:border-emerald-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
                    Concluídos
                  </p>
                  <p
                    className={`text-2xl font-extrabold mt-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {projetosConcluidos}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p
                className={`mt-3 text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Entregas finalizadas
              </p>
            </div>

            {/* Card 4: Projetos A Iniciar */}
            <div
              className={`p-5 rounded-2xl border relative overflow-hidden group transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-800 hover:border-blue-500/30'
                  : 'bg-white border-slate-200 hover:border-blue-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider">
                    A Iniciar
                  </p>
                  <p
                    className={`text-2xl font-extrabold mt-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {projetosAIniciar}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p
                className={`mt-3 text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Planejados para início
              </p>
            </div>

            {/* Card 5: Total de Turmas */}
            <div
              className={`p-5 rounded-2xl border relative overflow-hidden group transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-800 hover:border-indigo-500/30'
                  : 'bg-white border-slate-200 hover:border-indigo-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">
                    Total de Turmas
                  </p>
                  <p
                    className={`text-2xl font-extrabold mt-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {totalTurmas}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <p
                className={`mt-3 text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Turmas ativas e planejadas
              </p>
            </div>

            {/* Card 6: Verba Total */}
            <div
              className={`p-5 rounded-2xl border relative overflow-hidden group transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-800 hover:border-blue-500/30'
                  : 'bg-white border-slate-200 hover:border-blue-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider">
                    Verba Total
                  </p>
                  <p
                    className={`text-xl font-extrabold mt-1 truncate ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                    title={`R$ ${verbaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  >
                    R$ {verbaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p
                className={`mt-3 text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Orçamento aprovado
              </p>
            </div>

            {/* Card 7: Verba Gasta */}
            <div
              className={`p-5 rounded-2xl border relative overflow-hidden group transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-800 hover:border-red-500/30'
                  : 'bg-white border-slate-200 hover:border-red-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">
                    Verba Gasta
                  </p>
                  <p
                    className={`text-xl font-extrabold mt-1 truncate ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                    title={`R$ ${verbaGasta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  >
                    R$ {verbaGasta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <p
                className={`mt-3 text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Executado até o momento
              </p>
            </div>

            {/* Card 8: Saldo (Verba Total - Verba Gasta) */}
            <div
              className={`p-5 rounded-2xl border relative overflow-hidden group transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/30'
                  : 'bg-white border-slate-200 hover:border-emerald-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
                    Saldo Restante
                  </p>
                  <p
                    className={`text-xl font-extrabold mt-1 truncate ${
                      saldo < 0 ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                    title={`R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  >
                    R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <p
                className={`mt-3 text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {verbaTotal > 0 ? `${((saldo / verbaTotal) * 100).toFixed(1)}% disponível` : 'Saldo disponível'}
              </p>
            </div>
          </div>

          {/* Lista de Projetos Recentes */}
          <div
            className={`border rounded-2xl p-6 transition-colors duration-200 ${
              isDarkMode
                ? 'bg-slate-900/70 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-base font-bold tracking-wider ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  PROJETOS REGISTRADOS
                </h3>
                <p
                  className={`text-xs ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {filteredProjects.length} de {projects.length} projeto(s) correspondente(s) aos filtros
                </p>
              </div>
              <button
                onClick={fetchProjects}
                disabled={isLoadingProjects}
                className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProjects ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Estado de carregamento */}
            {isLoadingProjects ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  A carregar projetos...
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  A sincronizar com a base de dados do Supabase
                </p>
              </div>
            ) : filteredProjects.length === 0 ? (
              /* Estado vazio amigável */
              <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
                    isDarkMode
                      ? 'bg-slate-800/80 border-slate-700/60 text-slate-400'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  <FolderOpen className="w-7 h-7" />
                </div>
                <h4
                  className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  Nenhum projeto encontrado
                </h4>
                <p
                  className={`text-xs max-w-sm mt-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {projects.length === 0
                    ? 'Ainda não existem projetos cadastrados no sistema. Clique em "Novo Projeto" para adicionar o primeiro.'
                    : 'Nenhum projeto corresponde aos critérios de filtro selecionados. Tente ajustar ou limpar os filtros.'}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-5 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-rose-500 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Projeto</span>
                </button>
              </div>
            ) : (
              /* Lista de Projetos Reais Filtrados */
              <div
                className={`divide-y transition-colors ${
                  isDarkMode ? 'divide-slate-800/80' : 'divide-slate-200'
                }`}
              >
                {filteredProjects.map((proj) => {
                  const titulo = proj.nome_projeto || proj.nome || 'Projeto sem nome';

                  // Formatação de data auxiliar
                  const formatarData = (dtStr?: string | null) => {
                    if (!dtStr) return null;
                    const datePart = dtStr.includes('T') ? dtStr.split('T')[0] : dtStr;
                    const [ano, mes, dia] = datePart.split('-');
                    if (ano && mes && dia) {
                      return `${dia}/${mes}/${ano}`;
                    }
                    return dtStr;
                  };

                  const dataInicioFmt = formatarData(proj.data_inicio);
                  const dataFimFmt = formatarData(proj.data_fim);

                  let textoPrazo = 'A definir';
                  if (dataInicioFmt && dataFimFmt) {
                    textoPrazo = `De ${dataInicioFmt} a ${dataFimFmt}`;
                  } else if (dataFimFmt) {
                    textoPrazo = `Até ${dataFimFmt}`;
                  } else if (dataInicioFmt) {
                    textoPrazo = `A partir de ${dataInicioFmt}`;
                  }

                  // Status com valor padrão caso venha nulo
                  const statusAtual = proj.status || 'Em andamento';
                  let statusBadgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/30';
                  const sLower = statusAtual.toLowerCase();

                  if (sLower === 'a iniciar') {
                    statusBadgeClass = 'bg-blue-500/10 text-blue-500 border-blue-500/30';
                  } else if (sLower === 'concluído' || sLower.includes('conclu')) {
                    statusBadgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
                  } else if (sLower === 'cancelado' || sLower.includes('cancel')) {
                    statusBadgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/30';
                  } else if (sLower === 'paralisado') {
                    statusBadgeClass = 'bg-purple-500/10 text-purple-500 border-purple-500/30';
                  } else if (sLower === 'em andamento') {
                    statusBadgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/30';
                  }

                  // Indicador visual opcional de atraso (sem gravar no banco de dados)
                  const hojeStr = new Date().toISOString().slice(0, 10);
                  const dataFimStr = proj.data_fim ? proj.data_fim.slice(0, 10) : null;
                  const isAtrasadoVisual =
                    Boolean(dataFimStr && hojeStr > dataFimStr && !sLower.includes('conclu') && !sLower.includes('cancel'));

                  const verbaGastaValor = typeof proj.verba_gasta === 'number'
                    ? proj.verba_gasta
                    : Number(proj.verba_gasta) || 0;

                  const isAtualizandoStatus = statusAtualizandoId === proj.id;
                  const isStatusDropdownOpen = statusDropdownId === proj.id;

                  return (
                    <div
                      key={proj.id}
                      className={`py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 px-3 rounded-xl transition-colors ${
                        isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className={`text-sm font-semibold ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {titulo}
                          </span>

                          {/* Selo/Badge visual do Status INTERATIVO (Dropdown para alterar status) */}
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() =>
                                setStatusDropdownId((prev) => (prev === proj.id ? null : proj.id))
                              }
                              title="Clique para alterar o status do projeto"
                              disabled={isAtualizandoStatus}
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-wait ${statusBadgeClass}`}
                            >
                              {isAtualizandoStatus ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              )}
                              <span>{statusAtual}</span>
                              <ChevronRight className="w-3 h-3 rotate-90 opacity-70" />
                            </button>

                            {/* Dropdown de Seleção de Status */}
                            {isStatusDropdownOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setStatusDropdownId(null)}
                                />
                                <div
                                  className={`absolute left-0 top-full mt-1.5 w-44 rounded-xl border shadow-xl z-40 py-1.5 animate-in fade-in zoom-in-95 duration-150 ${
                                    isDarkMode
                                      ? 'bg-slate-900 border-slate-700 text-slate-200 shadow-black/60'
                                      : 'bg-white border-slate-200 text-slate-700 shadow-slate-300'
                                  }`}
                                >
                                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/50 mb-1">
                                    Alterar Status
                                  </div>
                                  {(['A iniciar', 'Em andamento', 'Concluído', 'Cancelado'] as StatusProjeto[]).map(
                                    (st) => {
                                      const isSelected =
                                        (proj.status || '').toLowerCase() === st.toLowerCase();
                                      return (
                                        <button
                                          key={st}
                                          type="button"
                                          onClick={() => handleUpdateStatus(proj.id, st)}
                                          className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium text-left transition-colors cursor-pointer ${
                                            isSelected
                                              ? 'text-red-500 font-semibold bg-red-500/10'
                                              : isDarkMode
                                              ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                                              : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                                          }`}
                                        >
                                          <span>{st}</span>
                                          {isSelected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                          )}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Indicador puramente visual de Atrasado (não gravado no banco) */}
                          {isAtrasadoVisual && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Atrasado
                            </span>
                          )}

                          {proj.modalidade && (
                            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-red-500/10 text-red-500 border-red-500/20">
                              {proj.modalidade}
                            </span>
                          )}

                          {proj.local && (
                            <span
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                                isDarkMode
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {proj.local}
                            </span>
                          )}
                        </div>

                        {/* Metadados: Gerente, Turmas, Verba e Verba Gasta */}
                        <div
                          className={`flex items-center gap-4 text-xs flex-wrap ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {proj.gerente_projeto && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                              Gerente: <strong className={isDarkMode ? 'font-medium text-slate-200' : 'font-medium text-slate-800'}>{proj.gerente_projeto}</strong>
                            </span>
                          )}

                          {proj.quantidade_turmas ? (
                            <span>
                              Turmas: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{proj.quantidade_turmas}</strong>
                            </span>
                          ) : null}

                          {proj.verba && (
                            <span>
                              Verba Total: <strong className="text-blue-500">
                                {typeof proj.verba === 'number'
                                  ? `R$ ${proj.verba.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                  : proj.verba}
                              </strong>
                            </span>
                          )}

                          <span>
                            Gasto: <strong className="text-red-500">
                              R$ {verbaGastaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 self-end md:self-center">
                        {/* Prazo com período completo */}
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                            Prazo
                          </p>
                          <p
                            className={`text-xs font-medium ${
                              isDarkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            {textoPrazo}
                          </p>
                        </div>

                        {/* Menu de opções (3 pontinhos) estritamente com a opção 'Abrir' */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMenuAbertoId((prev) => (prev === proj.id ? null : proj.id))
                            }
                            title="Opções do projeto"
                            className={`p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                              menuAbertoId === proj.id
                                ? isDarkMode
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-slate-200 text-slate-900'
                                : isDarkMode
                                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Menu Dropdown Flutuante */}
                          {menuAbertoId === proj.id && (
                            <>
                              {/* Backdrop invisível para fechar ao clicar fora */}
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setMenuAbertoId(null)}
                              />
                              <div
                                className={`absolute right-0 top-full mt-1.5 w-40 rounded-xl border shadow-xl z-40 py-1.5 animate-in fade-in zoom-in-95 duration-150 ${
                                  isDarkMode
                                    ? 'bg-slate-900 border-slate-700 text-slate-200 shadow-black/60'
                                    : 'bg-white border-slate-200 text-slate-700 shadow-slate-300'
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    setMenuAbertoId(null);
                                    router.push(`/projetos/${proj.id}`);
                                  }}
                                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                                    isDarkMode
                                      ? 'hover:bg-red-500/15 hover:text-red-400 text-slate-200'
                                      : 'hover:bg-red-50 hover:text-red-600 text-slate-800'
                                  }`}
                                >
                                  <ChevronRight className="w-3.5 h-3.5 text-red-500" />
                                  <span>Abrir</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Modal de 'Novo Projeto' com os campos exatos do banco de dados */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className={`border rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col transition-colors duration-200 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b shrink-0 ${
                isDarkMode ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Criar Novo Projeto
                  </h3>
                  <p
                    className={`text-xs ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Preencha os dados conforme os registos da base de dados
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-5 space-y-4 overflow-y-auto pr-1">
              {/* Feedback de erro no modal */}
              {modalError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* 1. Nome do Projeto */}
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex.: Projeto Iniciação Esportiva"
                  value={nomeProjeto}
                  onChange={(e) => setNomeProjeto(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDarkMode
                      ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* 2 & 3. Local e Modalidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    Local
                  </label>
                  <input
                    type="text"
                    placeholder="ex.: Ginásio Poliesportivo Norte"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-red-500" />
                    Modalidade
                  </label>
                  <input
                    type="text"
                    placeholder="ex.: Natação, Futebol, Voleibol"
                    value={modalidade}
                    onChange={(e) => setModalidade(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* 4. Gerente do Projeto */}
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  Gerente do Projeto
                </label>
                <input
                  type="text"
                  placeholder="ex.: Rodrigo Ferreira"
                  value={gerenteProjeto}
                  onChange={(e) => setGerenteProjeto(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDarkMode
                      ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* 5 & 6. Data de Início e Data de Fim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700 text-white [color-scheme:dark]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light]'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700 text-white [color-scheme:dark]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 [color-scheme:light]'
                    }`}
                  />
                </div>
              </div>

              {/* 7, 8 & 9. Qtd Horas Semanais, Qtd de Turmas e Verba */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Horas Semanais
                  </label>
                  <input
                    type="text"
                    placeholder="ex.: 20h ou 20"
                    value={horasSemanais}
                    onChange={(e) => setHorasSemanais(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Qtd. de Turmas
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="ex.: 4"
                    value={qtdTurmas}
                    onChange={(e) => setQtdTurmas(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Verba
                  </label>
                  <input
                    type="text"
                    placeholder="ex.: R$ 50.000,00"
                    value={verba}
                    onChange={(e) => setVerba(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`pt-4 flex justify-end gap-3 border-t ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                    isDarkMode
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast de Sucesso Flutuante */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${
            isDarkMode
              ? 'bg-slate-900 border-emerald-500/40 text-white shadow-emerald-950/50'
              : 'bg-white border-emerald-500/50 text-slate-900 shadow-slate-300'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Sucesso</p>
            <p
              className={`text-sm ${
                isDarkMode ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              {toastMessage}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className={`p-1 ml-2 rounded-lg transition-colors ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
