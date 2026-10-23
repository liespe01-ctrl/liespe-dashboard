'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Loader2,
  XCircle,
  CheckCircle2,
  User,
  Users,
  Phone,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  HeartPulse,
  Pill,
  Scale,
  Ruler,
  Globe,
  FileCheck2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface LinkData {
  id: string;
  projeto_id: string | number;
  expira_em: string;
  usado?: boolean | null;
  projetos?: {
    nome?: string | null;
    nome_projeto?: string | null;
    modalidade?: string | null;
    local?: string | null;
  } | null;
}

function InscricaoContent() {
  const params = useParams();
  const token = params?.token as string | undefined;

  // 1. Dados do Aluno
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nacionalidade, setNacionalidade] = useState('Brasileira');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');

  // 2. Projeto
  const [modalidade, setModalidade] = useState('');
  const [horario, setHorario] = useState('Manhã');

  // 3. Endereço
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');

  // 4. Filiação / Responsáveis
  const [nomePai, setNomePai] = useState('');
  const [celularPai, setCelularPai] = useState('');
  const [nomeMae, setNomeMae] = useState('');
  const [celularMae, setCelularMae] = useState('');
  const [outroResponsavel, setOutroResponsavel] = useState('');
  const [celularOutroResponsavel, setCelularOutroResponsavel] = useState('');

  // 5. Dados Médicos e Físicos
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [temProblemaSaude, setTemProblemaSaude] = useState<boolean>(false);
  const [qualProblemaSaude, setQualProblemaSaude] = useState('');
  const [alergiaMedicamento, setAlergiaMedicamento] = useState<boolean>(false);
  const [qualMedicamento, setQualMedicamento] = useState('');
  const [algumaAlergia, setAlgumaAlergia] = useState<boolean>(false);
  const [qualAlergia, setQualAlergia] = useState('');

  // Estados de controle e validação
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [projetoId, setProjetoId] = useState<string>('');
  const [nomeProjeto, setNomeProjeto] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validação de Segurança do Token ao carregar
  useEffect(() => {
    async function validarToken() {
      if (!token) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      setIsValidating(true);

      try {
        const { data, error } = await supabase
          .from('links_inscricao')
          .select('id, projeto_id, expira_em, usado, projetos(nome, nome_projeto, modalidade, local)')
          .eq('id', token)
          .single();

        if (error || !data) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        const linkData = data as unknown as LinkData;

        // Se já foi usado
        if (linkData.usado === true) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        // Se a data atual for maior que expira_em
        const agora = new Date();
        const expiraEm = new Date(linkData.expira_em);
        if (agora.getTime() > expiraEm.getTime()) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        // Token Válido
        setProjetoId(String(linkData.projeto_id));
        if (linkData.projetos) {
          setNomeProjeto(
            linkData.projetos.nome_projeto || linkData.projetos.nome || ''
          );
          if (linkData.projetos.modalidade) {
            setModalidade(linkData.projetos.modalidade);
          }
          if (linkData.projetos.local) {
            setCidade(linkData.projetos.local);
          }
        }
        setIsValid(true);
      } catch (err) {
        console.error('Erro ao validar link de inscrição:', err);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    validarToken();
  }, [token]);

  // Submissão do Formulário com todos os novos campos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projetoId || !token) {
      setSubmitError('Informações de projeto ou link inválidas.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Inserir dados completos na tabela 'alunos'
      const payloadAluno = {
        projeto_id: projetoId,
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        nacionalidade: nacionalidade.trim() || null,
        rg: rg.trim() || null,
        cpf: cpf.trim() || null,

        // Projeto
        modalidade: modalidade.trim() || null,
        horario: horario || null,

        // Endereço
        endereco: endereco.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,

        // Filiação / Responsáveis
        nome_pai: nomePai.trim() || null,
        celular_pai: celularPai.trim() || null,
        nome_mae: nomeMae.trim() || null,
        celular_mae: celularMae.trim() || null,
        outro_responsavel: outroResponsavel.trim() || null,
        celular_outro_responsavel: celularOutroResponsavel.trim() || null,

        // Dados Médicos e Físicos
        altura: altura.trim() || null,
        peso: peso.trim() || null,
        tem_problema_saude: temProblemaSaude,
        qual_problema_saude: temProblemaSaude ? qualProblemaSaude.trim() || null : null,
        alergia_medicamento: alergiaMedicamento,
        qual_medicamento: alergiaMedicamento ? qualMedicamento.trim() || null : null,
        alguma_alergia: algumaAlergia,
        qual_alergia: algumaAlergia ? qualAlergia.trim() || null : null,

        // Campos legados mantidos para compatibilidade com queries existentes
        nome_responsavel: (nomeMae || nomePai || outroResponsavel || '').trim() || null,
        contato: (celularMae || celularPai || celularOutroResponsavel || '').trim() || null,
        status: 'Ativo',
      };

      const { error: insertError } = await supabase
        .from('alunos')
        .insert(payloadAluno);

      if (insertError) {
        console.error('Erro ao inserir aluno no Supabase:', insertError.message);
        throw new Error(insertError.message);
      }

      // 2. Atualizar o link para bloqueá-lo (usado: true)
      const { error: updateError } = await supabase
        .from('links_inscricao')
        .update({ usado: true })
        .eq('id', token);

      if (updateError) {
        console.error('Aviso ao bloquear link no Supabase:', updateError.message);
      }

      // 3. Sucesso confirmado
      setIsSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar a inscrição.';
      console.error('Erro na submissão:', msg);
      setSubmitError(`Não foi possível concluir a inscrição: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 selection:bg-red-600 selection:text-white">
      {/* Container Principal Mobile-First com largura confortável */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl my-4 sm:my-8">
        {/* Barra de acento visual superior com gradiente Liespe (Vermelho & Azul) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-blue-600" />

        {/* 1. Logotipo e Identidade Visual Liespe */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div className="relative h-14 w-44 mb-2">
            <Image
              src="/Logo - Liespe.png"
              alt="Logo Liespe"
              fill
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            Ficha de Inscrição Oficial
          </h1>
          {nomeProjeto ? (
            <p className="text-xs text-blue-400 font-semibold mt-1">
              {nomeProjeto}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              Liga Ipatinguense de Esportes e Projetos
            </p>
          )}
        </div>

        {/* 2. Interface de Validação: Estado de Carregamento */}
        {isValidating ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-sm font-semibold text-white">
              Validando link de inscrição...
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              Aguarde um momento enquanto confirmamos a autenticidade do link.
            </p>
          </div>
        ) : !isValid ? (
          /* 3. Interface de Validação: Link Inválido ou Expirado */
          <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
              <XCircle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Link Não Disponível
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Este link de inscrição é inválido, já foi utilizado ou expirou.
              </p>
            </div>
            <div className="w-full pt-4 border-t border-slate-800 text-xs text-slate-500">
              Caso precise de uma nova inscrição, solicite um novo link diretamente à coordenação do projeto.
            </div>
          </div>
        ) : isSuccess ? (
          /* 4. Tela de Sucesso Completa */
          <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Cadastro Confirmado
              </span>
              <h2 className="text-xl font-extrabold text-white">
                Inscrição realizada com sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm pt-1">
                Os dados foram enviados para a coordenação do projeto.
              </p>
            </div>
            <div className="w-full mt-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 text-left space-y-1">
              <p className="font-semibold text-slate-200">Próximos Passos:</p>
              <p>• A equipe entrará em contato via WhatsApp/Telefone para confirmar o início das atividades.</p>
              <p>• Este link foi finalizado e não aceita novos cadastros.</p>
            </div>
          </div>
        ) : (
          /* 5. Formulário Completo Mobile-First Organizado em Seções */
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* SEÇÃO 1: DADOS DO ALUNO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-red-500" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Dados do Aluno
                </h2>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome Completo do Aluno *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Gabriel Henrique da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                />
              </div>

              {/* Data de Nascimento e Nacionalidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 [color-scheme:dark] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    Nacionalidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Brasileira"
                    value={nacionalidade}
                    onChange={(e) => setNacionalidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>
              </div>

              {/* RG e CPF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                    RG
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: MG-12.345.678"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                    CPF
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: 123.456.789-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: PROJETO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Layers className="w-4 h-4 text-blue-500" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Projeto
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Modalidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Futebol, Voleibol, Natação"
                    value={modalidade}
                    onChange={(e) => setModalidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Horário *
                  </label>
                  <select
                    required
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 [color-scheme:dark] transition-colors cursor-pointer"
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: ENDEREÇO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Endereço
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Endereço Completo (Rua, Número, Complemento)
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Rua das Flores, 120, Apto 101"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bairro
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Centro, Canaã, Iguaçu"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Ipatinga / MG"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: FILIAÇÃO / RESPONSÁVEIS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Users className="w-4 h-4 text-rose-500" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Filiação / Responsáveis
                </h2>
              </div>

              {/* Pai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome do Pai
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Carlos da Silva"
                    value={nomePai}
                    onChange={(e) => setNomePai(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Celular do Pai
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex.: (31) 98888-0000"
                    value={celularPai}
                    onChange={(e) => setCelularPai(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>
              </div>

              {/* Mãe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome da Mãe
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Mariana Silva"
                    value={nomeMae}
                    onChange={(e) => setNomeMae(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Celular da Mãe
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex.: (31) 99999-1111"
                    value={celularMae}
                    onChange={(e) => setCelularMae(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>
              </div>

              {/* Outro Responsável */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Outro Responsável (Tio, Avó, Tutor)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Teresa da Silva (Avó)"
                    value={outroResponsavel}
                    onChange={(e) => setOutroResponsavel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Celular do Outro Responsável
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex.: (31) 97777-2222"
                    value={celularOutroResponsavel}
                    onChange={(e) => setCelularOutroResponsavel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 5: DADOS MÉDICOS E FÍSICOS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Dados Médicos e Físicos
                </h2>
              </div>

              {/* Altura e Peso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-slate-400" />
                    Altura
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: 1,65m ou 165 cm"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    Peso
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: 55 kg"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                  />
                </div>
              </div>

              {/* Condicional 1: Problema de Saúde */}
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Tem algum problema de saúde? *
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="radio"
                      name="temProblemaSaude"
                      checked={temProblemaSaude === true}
                      onChange={() => setTemProblemaSaude(true)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                    />
                    <span>Sim</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="radio"
                      name="temProblemaSaude"
                      checked={temProblemaSaude === false}
                      onChange={() => {
                        setTemProblemaSaude(false);
                        setQualProblemaSaude('');
                      }}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                    />
                    <span>Não</span>
                  </label>
                </div>

                {temProblemaSaude && (
                  <div className="mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">
                      Qual problema de saúde? *
                    </label>
                    <input
                      type="text"
                      required={temProblemaSaude}
                      placeholder="Ex.: Asma, bronquite, cardiopatia, diabetes..."
                      value={qualProblemaSaude}
                      onChange={(e) => setQualProblemaSaude(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-red-500/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Condicional 2: Alergia a Medicamentos */}
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-amber-500" />
                  Alergia a medicamentos? *
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="radio"
                      name="alergiaMedicamento"
                      checked={alergiaMedicamento === true}
                      onChange={() => setAlergiaMedicamento(true)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                    />
                    <span>Sim</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="radio"
                      name="alergiaMedicamento"
                      checked={alergiaMedicamento === false}
                      onChange={() => {
                        setAlergiaMedicamento(false);
                        setQualMedicamento('');
                      }}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                    />
                    <span>Não</span>
                  </label>
                </div>

                {alergiaMedicamento && (
                  <div className="mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                      Qual medicamento? *
                    </label>
                    <input
                      type="text"
                      required={alergiaMedicamento}
                      placeholder="Ex.: Dipirona, penicilina, anti-inflamatórios..."
                      value={qualMedicamento}
                      onChange={(e) => setQualMedicamento(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-amber-500/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Condicional 3: Algum outro tipo de alergia */}
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                  Algum outro tipo de alergia? *
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="radio"
                      name="algumaAlergia"
                      checked={algumaAlergia === true}
                      onChange={() => setAlgumaAlergia(true)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                    />
                    <span>Sim</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                    <input
                      type="radio"
                      name="algumaAlergia"
                      checked={algumaAlergia === false}
                      onChange={() => {
                        setAlgumaAlergia(false);
                        setQualAlergia('');
                      }}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                    />
                    <span>Não</span>
                  </label>
                </div>

                {algumaAlergia && (
                  <div className="mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">
                      Qual alergia? *
                    </label>
                    <input
                      type="text"
                      required={algumaAlergia}
                      placeholder="Ex.: Alimentos (glúten, frutos do mar), picada de inseto, poeira..."
                      value={qualAlergia}
                      onChange={(e) => setQualAlergia(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-blue-500/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Termos e Proteção */}
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Dados protegidos pela LGPD e tratados exclusivamente pela Liespe para fins desportivos.</span>
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Inscrição Completa...</span>
                </>
              ) : (
                <span>Confirmar Inscrição</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function InscricaoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400">Carregando ficha de inscrição...</span>
          </div>
        </div>
      }
    >
      <InscricaoContent />
    </Suspense>
  );
}
