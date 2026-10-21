export const STATUS_VALIDOS = [
  'A iniciar',
  'Em andamento',
  'Cancelado',
  'Paralisado',
  'Concluído',
] as const;

export type StatusProjeto = typeof STATUS_VALIDOS[number];

export function isStatusValido(status: unknown): status is StatusProjeto {
  return typeof status === 'string' && STATUS_VALIDOS.includes(status as StatusProjeto);
}
