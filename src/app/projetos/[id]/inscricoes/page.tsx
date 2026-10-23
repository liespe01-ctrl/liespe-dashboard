'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  ChevronRight,
  ShieldAlert,
  User,
  Phone,
  MapPin,
  HeartPulse,
  Clock,
  Layers,
  X,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export interface Aluno {
  id: string | number;
  projeto_id: string | number;
  turma?: string | null;
  nome: string;
  data_nascimento?: string | null;
  nacionalidade?: string | null;
  rg?: string | null;
  cpf?: string | null;
  modalidade?: string | null;
  horario?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  nome_pai?: string | null;
  celular_pai?: string | null;
  nome_mae?: string | null;
  celular_mae?: string | null;
  outro_responsavel?: string | null;
  celular_outro_responsavel?: string | null;
  altura?: string | null;
  peso?: string | null;
  tem_problema_saude?: boolean | null;
  qual_problema_saude?: string | null;
  alergia_medicamento?: boolean | null;
  qual_medicamento?: string | null;
  alguma_alergia?: boolean | null;
  qual_alergia?: string | null;
  nome_responsavel?: string | null;
  contato?: string | null;
  status?: string | null;
  created_at?: string | null;
}

interface ProjetoInfo {
  id: string | number;
  nome_projeto?: string | null;
  nome?: string | null;
  modalidade?: string | null;
  local?: string | null;
}

function InscricoesContent() {
  const params = useParams();
  const router = useRouter();
  const idProjeto = params?.id as string | undefined;

  // Tema Claro/Escuro consistente com o sistema
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Estados dos dados
  const [projeto, setProjeto] = useState<ProjetoInfo | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmasOpcoes, setTurmasOpcoes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Ativo' | 'Inativo'>('todos');
  const [turmaFilter, setTurmaFilter] = useState<string>('todos');

  // Modais
  const [alunoVisualizar, setAlunoVisualizar] = useState<Aluno | null>(null);
  const [alunoEditar, setAlunoEditar] = useState<Aluno | null>(null);
  const [alunoExcluir, setAlunoExcluir] = useState<Aluno | null>(null);

  // Estados de ação dos modais
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  // Inicializar Tema
  useEffect(() => {
    const temaSalvo = localStorage.getItem('liespe_theme');
    if (temaSalvo === 'light') {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;
      localStorage.setItem('liespe_theme', nextTheme ? 'dark' : 'light');
      return nextTheme;
    });
  };

  // Buscar Projeto e Alunos do Supabase
  const carregarDados = async () => {
    if (!idProjeto) {
      setErro('ID do projeto não fornecido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErro(null);

    try {
      // 1. Buscar detalhes do projeto para o cabeçalho
      const { data: projData, error: projErr } = await supabase
        .from('projetos')
        .select('id, nome_projeto, nome, modalidade, local')
        .eq('id', idProjeto)
        .single();

      if (!projErr && projData) {
        setProjeto(projData);
      }

      // 2. Buscar nomes de turmas cadastradas para o projeto (se a tabela existir)
      try {
        const { data: turmasData } = await supabase
          .from('turmas')
          .select('nome')
          .eq('projeto_id', idProjeto)
          .order('nome', { ascending: true });

        if (turmasData && turmasData.length > 0) {
          const nomes = Array.from(new Set(turmasData.map((t) => t.nome).filter(Boolean))) as string[];
          setTurmasOpcoes(nomes);
        }
      } catch {
        // Tabela turmas opcional
      }

      // 3. Buscar alunos filtrados pelo projeto_id com a coluna 'turma' (TEXT)
      const { data: alunosData, error: alunosErr } = await supabase
        .from('alunos')
        .select('*')
        .eq('projeto_id', idProjeto);

      if (alunosErr) {
        throw new Error(alunosErr.message);
      }

      const lista = (alunosData as Aluno[]) || [];
      setAlunos(lista);

      // Combinar turmas cadastradas com valores de 'turma' já presentes nos alunos
      setTurmasOpcoes((prev) => {
        const set = new Set<string>(prev);
        lista.forEach((a) => {
          if (a.turma && typeof a.turma === 'string' && a.turma.trim() !== '') {
            set.add(a.turma.trim());
          }
        });
        // Garantir que opções padrão comuns estejam presentes se ainda estiver vazio
        if (set.size === 0) {
          ['Turma 1', 'Turma 2', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17'].forEach((opt) => set.add(opt));
        }
        return Array.from(set).sort();
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar alunos no Supabase.';
      console.error('Erro na listagem de alunos:', msg);
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [idProjeto]);

  // Lista consolidada de turmas para o filtro
  const turmasDisponiveisParaFiltro = useMemo(() => {
    const set = new Set<string>(turmasOpcoes);
    alunos.forEach((a) => {
      if (a.turma && typeof a.turma === 'string' && a.turma.trim() !== '') {
        set.add(a.turma.trim());
      }
    });
    return Array.from(set).sort();
  }, [turmasOpcoes, alunos]);

  // Alunos Filtrados por Busca, Status, Turma e com Ordenação Especial (sem turma no topo)
  const alunosFiltrados = useMemo(() => {
    // 1. Filtragem
    const filtrados = alunos.filter((aluno) => {
      const matchesSearch =
        searchTerm === '' ||
        aluno.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.rg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.modalidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (aluno.turma && aluno.turma.toLowerCase().includes(searchTerm.toLowerCase()));

      const statusAtual = aluno.status || 'Ativo';
      const matchesStatus =
        statusFilter === 'todos' || statusAtual.toLowerCase() === statusFilter.toLowerCase();

      // Filtro de Turma:
      // 'todos': tudo
      // 'sem_turma': turma é null/vazio/undefined
      // '<nome>': turma é igual ao texto selecionado
      let matchesTurma = true;
      const tNome = aluno.turma && typeof aluno.turma === 'string' ? aluno.turma.trim() : '';

      if (turmaFilter === 'sem_turma') {
        matchesTurma = !tNome;
      } else if (turmaFilter !== 'todos') {
        matchesTurma = tNome.toLowerCase() === turmaFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus && matchesTurma;
    });

    // 2. Ordenação Customizada:
    // Alunos sem turma (nulo, vazio ou undefined) aparecem SEMPRE no topo da lista.
    // Os restantes aparecem logo abaixo, ordenados ou agrupados pelo seu texto de turma.
    return filtrados.sort((a, b) => {
      const aSemTurma = !a.turma || typeof a.turma !== 'string' || a.turma.trim() === '';
      const bSemTurma = !b.turma || typeof b.turma !== 'string' || b.turma.trim() === '';

      if (aSemTurma && !bSemTurma) return -1;
      if (!aSemTurma && bSemTurma) return 1;

      // Se ambos não têm turma, ordenar por ordem alfabética do nome do aluno
      if (aSemTurma && bSemTurma) {
        return (a.nome || '').localeCompare(b.nome || '');
      }

      // Se ambos têm turma, agrupar pelo nome da turma e depois pelo nome do aluno
      const aTurmaStr = String(a.turma || '').trim();
      const bTurmaStr = String(b.turma || '').trim();
      const cmpTurma = aTurmaStr.localeCompare(bTurmaStr, undefined, { numeric: true });
      if (cmpTurma !== 0) return cmpTurma;

      return (a.nome || '').localeCompare(b.nome || '');
    });
  }, [alunos, searchTerm, statusFilter, turmaFilter]);

  // Excluir Aluno
  const handleConfirmExcluir = async () => {
    if (!alunoExcluir) return;

    setIsDeleting(true);
    try {
      const { error: delError } = await supabase
        .from('alunos')
        .delete()
        .eq('id', alunoExcluir.id);

      if (delError) {
        throw new Error(delError.message);
      }

      // Atualizar a lista localmente sem refresh manual
      setAlunos((prev) => prev.filter((a) => a.id !== alunoExcluir.id));
      setAlunoExcluir(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover aluno.';
      alert(`Falha ao excluir: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Salvar Edição de Aluno (atualizando a coluna 'turma' como TEXT)
  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoEditar) return;

    setIsSaving(true);
    setFormFeedback(null);

    try {
      // 1. Tratamento da coluna 'turma':
      // Se não houver turma selecionada ("" ou apenas espaços), enviar explicitamente null.
      const rawTurma = alunoEditar.turma;
      const normalizedTurma =
        rawTurma && typeof rawTurma === 'string' && rawTurma.trim() !== ''
          ? rawTurma.trim()
          : null;

      // 2. Sanitização do Payload:
      // Atualiza a coluna 'turma' (TEXT) e remove qualquer menção a 'turma_id' ou campos virtuais.
      const payloadUpdate: Record<string, unknown> = {
        nome: alunoEditar.nome ? alunoEditar.nome.trim() : '',
        turma: normalizedTurma,
        status: alunoEditar.status || 'Ativo',
        data_nascimento: alunoEditar.data_nascimento || null,
        nacionalidade: alunoEditar.nacionalidade?.trim() || null,
        rg: alunoEditar.rg?.trim() || null,
        cpf: alunoEditar.cpf?.trim() || null,
        modalidade: alunoEditar.modalidade?.trim() || null,
        horario: alunoEditar.horario || null,
        endereco: alunoEditar.endereco?.trim() || null,
        bairro: alunoEditar.bairro?.trim() || null,
        cidade: alunoEditar.cidade?.trim() || null,
        nome_pai: alunoEditar.nome_pai?.trim() || null,
        celular_pai: alunoEditar.celular_pai?.trim() || null,
        nome_mae: alunoEditar.nome_mae?.trim() || null,
        celular_mae: alunoEditar.celular_mae?.trim() || null,
        outro_responsavel: alunoEditar.outro_responsavel?.trim() || null,
        celular_outro_responsavel: alunoEditar.celular_outro_responsavel?.trim() || null,
        altura: alunoEditar.altura?.trim() || null,
        peso: alunoEditar.peso?.trim() || null,
        tem_problema_saude: Boolean(alunoEditar.tem_problema_saude),
        qual_problema_saude: alunoEditar.tem_problema_saude ? alunoEditar.qual_problema_saude?.trim() || null : null,
        alergia_medicamento: Boolean(alunoEditar.alergia_medicamento),
        qual_medicamento: alunoEditar.alergia_medicamento ? alunoEditar.qual_medicamento?.trim() || null : null,
        alguma_alergia: Boolean(alunoEditar.alguma_alergia),
        qual_alergia: alunoEditar.alguma_alergia ? alunoEditar.qual_alergia?.trim() || null : null,
      };

      // Debug do payload exato antes do PATCH
      console.log('[Supabase PATCH /alunos] ID do Aluno:', alunoEditar.id);
      console.log('[Supabase PATCH /alunos] Payload:', JSON.stringify(payloadUpdate, null, 2));

      const { data: updateData, error: updError } = await supabase
        .from('alunos')
        .update(payloadUpdate)
        .eq('id', alunoEditar.id)
        .select();

      if (updError) {
        console.error('[Supabase PATCH /alunos] Erro retornado:', updError);
        throw new Error(updError.message || `Erro ${updError.code}: ${updError.details || 'Falha ao atualizar'}`);
      }

      console.log('[Supabase PATCH /alunos] Sucesso:', updateData);

      // Atualizar lista localmente
      setAlunos((prev) =>
        prev.map((a) =>
          a.id === alunoEditar.id
            ? {
                ...a,
                ...payloadUpdate,
              }
            : a
        )
      );

      setFormFeedback({ tipo: 'sucesso', mensagem: 'Dados do aluno atualizados com sucesso!' });
      setTimeout(() => {
        setAlunoEditar(null);
        setFormFeedback(null);
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar dados.';
      setFormFeedback({ tipo: 'erro', mensagem: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-red-600 selection:text-white ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. Header do Sistema com Logo da LIESPE alinhada ao botão Voltar */}
      <header
        className={`h-20 px-4 sm:px-8 border-b backdrop-blur-md flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 ${
          isDarkMode
            ? 'border-slate-800/80 bg-slate-900/75'
            : 'border-slate-200 bg-white/85 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Botão Voltar ao Projeto */}
          <Link
            href={`/projetos/${idProjeto}`}
            className={`p-2.5 sm:px-3.5 sm:py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer group ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-red-500 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Voltar ao Projeto</span>
          </Link>

          <div
            className={`h-7 w-px hidden sm:block ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />

          {/* Logótipo Liespe (Idêntico ao de Gestão Interna) */}
          <div className="relative h-10 w-32 shrink-0">
            <Image
              src="/Logo - Liespe.png"
              alt="Logo Liespe"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-3">
          <button
            onClick={carregarDados}
            title="Recarregar Lista"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Alternar modo claro e escuro"
            className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700/80 text-amber-400 hover:bg-slate-700 hover:text-amber-300'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Breadcrumb e Título Principal (Heading: Alunos Inscritos) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link href="/dashboard" className="hover:text-red-500 transition-colors">
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/projetos/${idProjeto}`} className="hover:text-red-500 transition-colors">
              {projeto?.nome_projeto || projeto?.nome || 'Gestão do Projeto'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>
              Alunos Inscritos
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-8 rounded-full bg-gradient-to-b from-red-600 to-blue-600 shrink-0" />
                <h1
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Alunos Inscritos
                </h1>
              </div>
              <p
                className={`mt-1.5 text-xs sm:text-sm pl-5.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Projeto: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{projeto?.nome_projeto || projeto?.nome || 'Carregando...'}</strong>
                {projeto?.modalidade && ` • Modalidade: ${projeto.modalidade}`}
                {projeto?.local && ` • Núcleo: ${projeto.local}`}
              </p>
            </div>

            {/* Totalizador de Alunos */}
            <div
              className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 self-start sm:self-auto ${
                isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total de Inscritos
                </p>
                <p
                  className={`text-lg font-black ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {alunos.length} {alunos.length === 1 ? 'aluno' : 'alunos'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Barra de Busca e Filtros (Filtro Exclusivo por Turma TEXT) */}
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Input de Busca Geral */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por aluno, CPF, RG, cidade ou turma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/80 border-slate-700/80 text-white placeholder:text-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Grupo de Filtros: Filtro de Turma + Filtro de Status */}
            <div className="flex flex-wrap items-center gap-3">
              {/* FILTRO SUPERIOR EXCLUSIVO DE TURMA (TEXT) */}
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-red-500 shrink-0" />
                <select
                  value={turmaFilter}
                  onChange={(e) => setTurmaFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer transition-colors ${
                    isDarkMode
                      ? 'bg-slate-800/90 border-slate-700/80 text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todas as Turmas</option>
                  <option value="sem_turma">Sem Turma Definida</option>
                  {turmasDisponiveisParaFiltro.map((turmaNome) => (
                    <option key={turmaNome} value={turmaNome}>
                      {turmaNome}
                    </option>
                  ))}
                </select>
              </div>

              {/* FILTRO DE STATUS (Todos, Ativo, Inativo) */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <div
                  className={`flex p-1 rounded-xl border ${
                    isDarkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {(['todos', 'Ativo', 'Inativo'] as const).map((filtro) => {
                    const isActive = statusFilter === filtro;
                    return (
                      <button
                        key={filtro}
                        onClick={() => setStatusFilter(filtro)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          isActive
                            ? 'bg-red-600 text-white shadow-xs'
                            : isDarkMode
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {filtro === 'todos' ? 'Todos' : filtro}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Tabela de Alunos Inscritos / Data Table */}
        <div
          className={`rounded-2xl border overflow-hidden transition-colors ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
          }`}
        >
          {erro && (
            <div className="p-4 bg-red-500/15 border-b border-red-500/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs text-red-400">{erro}</p>
            </div>
          )}

          {isLoading ? (
            /* Skeleton Loading State */
            <div className="p-8 space-y-4">
              <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-400 py-6">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span>Buscando alunos inscritos no Supabase...</span>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-14 rounded-xl animate-pulse ${
                    isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100'
                  }`}
                />
              ))}
            </div>
          ) : alunosFiltrados.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mx-auto flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <h3
                className={`text-base font-bold ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Nenhum aluno encontrado
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {alunos.length === 0
                  ? 'Este projeto ainda não possui nenhum aluno cadastrado.'
                  : 'Nenhum aluno corresponde aos filtros aplicados.'}
              </p>
            </div>
          ) : (
            /* Data Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDarkMode
                        ? 'border-slate-800 bg-slate-900/90 text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <th className="py-3.5 px-4 sm:px-6">Aluno</th>
                    {/* COLUNA TURMA BASEADA EM ALUNO.TURMA (TEXT) */}
                    <th className="py-3.5 px-4">Turma</th>
                    <th className="py-3.5 px-4">Modalidade / Turno</th>
                    <th className="py-3.5 px-4">Responsável / Contato</th>
                    <th className="py-3.5 px-4">Localidade</th>
                    <th className="py-3.5 px-4">Saúde / Alergias</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y text-xs sm:text-sm ${
                    isDarkMode ? 'divide-slate-800' : 'divide-slate-100'
                  }`}
                >
                  {alunosFiltrados.map((aluno) => {
                    const statusAtivo = (aluno.status || 'Ativo').toLowerCase() === 'ativo';
                    const temAlertasSaude =
                      aluno.tem_problema_saude ||
                      aluno.alergia_medicamento ||
                      aluno.alguma_alergia;
                    const temTurma = aluno.turma && typeof aluno.turma === 'string' && aluno.turma.trim() !== '';

                    return (
                      <tr
                        key={aluno.id}
                        className={`transition-colors duration-150 ${
                          isDarkMode
                            ? 'hover:bg-slate-800/40'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* 1. Aluno */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span
                              className={`text-sm ${
                                isDarkMode ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {aluno.nome}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            {aluno.cpf && <span>CPF: {aluno.cpf}</span>}
                            {aluno.data_nascimento && (
                              <span>Nasc: {aluno.data_nascimento}</span>
                            )}
                          </div>
                        </td>

                        {/* 2. Turma (Propriedade turma TEXT) */}
                        <td className="py-4 px-4">
                          {temTurma ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                isDarkMode
                                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                              <span>{aluno.turma}</span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-dashed ${
                                isDarkMode
                                  ? 'bg-amber-500/10 text-amber-400/90 border-amber-500/30'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}
                            >
                              <span>Sem Turma</span>
                            </span>
                          )}
                        </td>

                        {/* 3. Modalidade / Turno */}
                        <td className="py-4 px-4">
                          <p
                            className={`font-semibold ${
                              isDarkMode ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {aluno.modalidade || projeto?.modalidade || 'A definir'}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {aluno.horario || 'Não informado'}
                          </p>
                        </td>

                        {/* 4. Responsável / Contato */}
                        <td className="py-4 px-4">
                          <p
                            className={`font-medium ${
                              isDarkMode ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {aluno.nome_mae ||
                              aluno.nome_pai ||
                              aluno.outro_responsavel ||
                              aluno.nome_responsavel ||
                              'Não informado'}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {aluno.celular_mae ||
                              aluno.celular_pai ||
                              aluno.celular_outro_responsavel ||
                              aluno.contato ||
                              '—'}
                          </p>
                        </td>

                        {/* 5. Localidade */}
                        <td className="py-4 px-4">
                          <p
                            className={`text-xs ${
                              isDarkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            {aluno.bairro || 'Bairro ñ inf.'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {aluno.cidade || 'Cidade ñ inf.'}
                          </p>
                        </td>

                        {/* 6. Saúde / Alergias Badge */}
                        <td className="py-4 px-4">
                          {temAlertasSaude ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              Atenção Médica
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Regular
                            </span>
                          )}
                        </td>

                        {/* 7. Status */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              statusAtivo
                                ? isDarkMode
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isDarkMode
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : 'bg-slate-100 text-slate-500 border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                statusAtivo ? 'bg-emerald-400' : 'bg-slate-400'
                              }`}
                            />
                            {aluno.status || 'Ativo'}
                          </span>
                        </td>

                        {/* 8. Ações: Visualizar, Editar, Excluir */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Visualizar */}
                            <button
                              onClick={() => setAlunoVisualizar(aluno)}
                              title="Visualizar Detalhes do Aluno"
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isDarkMode
                                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
                              }`}
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => {
                                setAlunoEditar({ ...aluno });
                                setFormFeedback(null);
                              }}
                              title="Editar Inscrição"
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isDarkMode
                                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
                              }`}
                            >
                              <Edit2 className="w-4 h-4 text-amber-400" />
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => setAlunoExcluir(aluno)}
                              title="Excluir Aluno"
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isDarkMode
                                  ? 'bg-slate-800/80 border-slate-700 text-red-400 hover:text-red-300 hover:bg-red-500/20'
                                  : 'bg-white border-slate-200 text-red-600 hover:bg-red-50 shadow-xs'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: VISUALIZAR INSCRIÇÃO                                             */}
      {/* ========================================================================= */}
      {alunoVisualizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Cabeçalho do Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Ficha de Inscrição: {alunoVisualizar.nome}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID #{alunoVisualizar.id} • Status: {alunoVisualizar.status || 'Ativo'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAlunoVisualizar(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
              {/* 1. Dados Pessoais */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <User className="w-3.5 h-3.5" /> Dados do Aluno
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Nome</span>
                    <span className="font-semibold text-white">{alunoVisualizar.nome}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Data de Nascimento</span>
                    <span className="font-semibold text-white">{alunoVisualizar.data_nascimento || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Nacionalidade</span>
                    <span className="font-semibold text-white">{alunoVisualizar.nacionalidade || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">RG</span>
                    <span className="font-semibold text-white">{alunoVisualizar.rg || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">CPF</span>
                    <span className="font-semibold text-white">{alunoVisualizar.cpf || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Projeto e Turma (TEXT) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <Layers className="w-3.5 h-3.5" /> Projeto e Turma
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Turma</span>
                    <span className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      {alunoVisualizar.turma || 'Sem Turma Definida'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Modalidade</span>
                    <span className="font-semibold text-white">{alunoVisualizar.modalidade || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Horário / Turno</span>
                    <span className="font-semibold text-white">{alunoVisualizar.horario || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Endereço */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <MapPin className="w-3.5 h-3.5" /> Endereço Residencial
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60 sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Logradouro</span>
                    <span className="font-semibold text-white">{alunoVisualizar.endereco || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Bairro</span>
                    <span className="font-semibold text-white">{alunoVisualizar.bairro || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Cidade</span>
                    <span className="font-semibold text-white">{alunoVisualizar.cidade || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Responsáveis */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <Users className="w-3.5 h-3.5" /> Filiação / Responsáveis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Nome da Mãe</span>
                    <span className="font-semibold text-white">{alunoVisualizar.nome_mae || '—'}</span>
                    <span className="text-xs text-slate-400 block mt-1">Contato: {alunoVisualizar.celular_mae || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Nome do Pai</span>
                    <span className="font-semibold text-white">{alunoVisualizar.nome_pai || '—'}</span>
                    <span className="text-xs text-slate-400 block mt-1">Contato: {alunoVisualizar.celular_pai || '—'}</span>
                  </div>
                  {(alunoVisualizar.outro_responsavel || alunoVisualizar.celular_outro_responsavel) && (
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60 sm:col-span-2">
                      <span className="text-[11px] text-slate-400 block font-semibold uppercase">Outro Responsável</span>
                      <span className="font-semibold text-white">{alunoVisualizar.outro_responsavel || '—'}</span>
                      <span className="text-xs text-slate-400 block mt-1">Contato: {alunoVisualizar.celular_outro_responsavel || '—'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Dados Médicos e Físicos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <HeartPulse className="w-3.5 h-3.5" /> Informações Médicas e Físicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Altura</span>
                    <span className="font-semibold text-white">{alunoVisualizar.altura || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Peso</span>
                    <span className="font-semibold text-white">{alunoVisualizar.peso || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Problema de Saúde?</span>
                    <span className={`font-semibold ${alunoVisualizar.tem_problema_saude ? 'text-red-400' : 'text-white'}`}>
                      {alunoVisualizar.tem_problema_saude ? `Sim: ${alunoVisualizar.qual_problema_saude || 'Não especificado'}` : 'Não'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Alergia a Medicamentos?</span>
                    <span className={`font-semibold ${alunoVisualizar.alergia_medicamento ? 'text-amber-400' : 'text-white'}`}>
                      {alunoVisualizar.alergia_medicamento ? `Sim: ${alunoVisualizar.qual_medicamento || 'Não especificado'}` : 'Não'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/60 sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Outras Alergias?</span>
                    <span className={`font-semibold ${alunoVisualizar.alguma_alergia ? 'text-blue-400' : 'text-white'}`}>
                      {alunoVisualizar.alguma_alergia ? `Sim: ${alunoVisualizar.qual_alergia || 'Não especificado'}` : 'Não'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAlunoVisualizar(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDITAR INSCRIÇÃO (Com Select de Turma em TEXT simples)           */}
      {/* ========================================================================= */}
      {alunoEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Cabeçalho */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Editar Inscrição de Aluno
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina a turma e atualize os dados cadastrais do aluno.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAlunoEditar(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Message */}
            {formFeedback && (
              <div
                className={`p-3 text-xs font-semibold flex items-center gap-2 border-b ${
                  formFeedback.tipo === 'sucesso'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                }`}
              >
                {formFeedback.tipo === 'sucesso' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{formFeedback.mensagem}</span>
              </div>
            )}

            {/* Formulário com Scroll */}
            <form onSubmit={handleSalvarEdicao} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm flex-1">
                {/* DESTAQUE 1: CAMPO DE STATUS OBRIGATÓRIO (Ativo / Inativo) */}
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400 block">
                      Status da Inscrição *
                    </span>
                    <p className="text-xs text-slate-400">
                      Defina se o aluno está participando ativamente das turmas deste projeto.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={alunoEditar.status || 'Ativo'}
                      onChange={(e) =>
                        setAlunoEditar({ ...alunoEditar, status: e.target.value })
                      }
                      className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* DESTAQUE 2: TURMA DO ALUNO (TEXT SIMPLES) */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    Turma do Aluno
                  </label>
                  <p className="text-xs text-slate-400">
                    Selecione uma das turmas disponíveis ou digite o nome de uma nova turma.
                  </p>

                  <div className="space-y-2">
                    <select
                      value={alunoEditar.turma || ''}
                      onChange={(e) =>
                        setAlunoEditar({
                          ...alunoEditar,
                          turma: e.target.value ? e.target.value : null,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="">-- Sem Turma Definida --</option>
                      {turmasDisponiveisParaFiltro.map((nomeTurma) => (
                        <option key={nomeTurma} value={nomeTurma}>
                          {nomeTurma}
                        </option>
                      ))}
                    </select>

                    <div className="pt-1">
                      <span className="text-[11px] text-slate-400 block mb-1">
                        Ou digite outro nome para a turma:
                      </span>
                      <input
                        type="text"
                        placeholder="Ex.: Turma 1, Turma 2, Sub-11..."
                        value={alunoEditar.turma || ''}
                        onChange={(e) =>
                          setAlunoEditar({
                            ...alunoEditar,
                            turma: e.target.value ? e.target.value : null,
                          })
                        }
                        className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 1. Dados Pessoais */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Dados Pessoais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={alunoEditar.nome || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, nome: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={alunoEditar.data_nascimento || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, data_nascimento: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Nacionalidade
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.nacionalidade || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, nacionalidade: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        RG
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.rg || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, rg: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.cpf || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, cpf: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Modalidade e Horário */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Modalidade e Turno
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Modalidade
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.modalidade || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, modalidade: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Horário / Turno
                      </label>
                      <select
                        value={alunoEditar.horario || 'Manhã'}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, horario: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Endereço */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Endereço
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.endereco || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, endereco: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.bairro || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, bairro: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.cidade || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, cidade: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Responsáveis */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Filiação e Responsáveis
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Nome da Mãe
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.nome_mae || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, nome_mae: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Celular da Mãe
                      </label>
                      <input
                        type="tel"
                        value={alunoEditar.celular_mae || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, celular_mae: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Nome do Pai
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.nome_pai || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, nome_pai: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Celular do Pai
                      </label>
                      <input
                        type="tel"
                        value={alunoEditar.celular_pai || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, celular_pai: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Dados Médicos */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Dados Médicos e Físicos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Altura
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.altura || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, altura: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block font-semibold uppercase mb-1">
                        Peso
                      </label>
                      <input
                        type="text"
                        value={alunoEditar.peso || ''}
                        onChange={(e) =>
                          setAlunoEditar({ ...alunoEditar, peso: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé do Formulário */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setAlunoEditar(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando Alterações...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXCLUIR ALUNO                                                    */}
      {/* ========================================================================= */}
      {alunoExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3
                className={`text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Remover Aluno do Projeto?
              </h3>
              <p className="text-xs text-slate-400">
                Tem certeza que deseja remover o cadastro de{' '}
                <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                  {alunoExcluir.nome}
                </strong>
                ? Esta ação é definitiva e removerá a inscrição do banco de dados do Supabase.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAlunoExcluir(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmExcluir}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Sim, Remover</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InscricoesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex items-center gap-3 text-red-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-semibold text-white">Carregando alunos inscritos...</span>
          </div>
        </div>
      }
    >
      <InscricoesContent />
    </Suspense>
  );
}
