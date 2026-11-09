import { FormatError } from '@/models/auth';

type Json = Record<string, unknown>;

export type AppAlertType = 'information' | 'success' | 'warning' | 'error' | 'confirmation';

export function parseAppAlertType(value: unknown): AppAlertType {
  switch (String(value ?? '').trim().toLowerCase()) {
    case 'information':
    case 'info':
      return 'information';
    case 'success':
      return 'success';
    case 'warning':
    case 'attention':
      return 'warning';
    case 'error':
      return 'error';
    case 'confirmation':
    case 'confirm':
      return 'confirmation';
    default:
      throw new FormatError(`Tipo de modal inválido: ${String(value)}`);
  }
}

export interface AppAlertConfig {
  id: string;
  type: AppAlertType;
  title: string;
  message: string;
  icon: string;
  confirmLabel: string;
  cancelLabel?: string;
  dismissible: boolean;
  enabled: boolean;
}

const str = (value: unknown) => (value == null ? '' : String(value).trim());

export function parseAppAlertConfig(json: Json): AppAlertConfig {
  const id = str(json.id);
  const title = str(json.title);
  const message = str(json.message);
  const confirmLabel = str(json.confirmLabel);

  if (!id) throw new FormatError('O campo id do modal é obrigatório.');
  if (!title) throw new FormatError(`O título do modal "${id}" é obrigatório.`);
  if (!message) throw new FormatError(`A mensagem do modal "${id}" é obrigatória.`);
  if (!confirmLabel) {
    throw new FormatError(`O texto do botão principal do modal "${id}" é obrigatório.`);
  }

  const cancelLabel = str(json.cancelLabel);

  return {
    id,
    type: parseAppAlertType(json.type),
    title,
    message,
    icon: str(json.icon) || 'info',
    confirmLabel,
    cancelLabel: cancelLabel || undefined,
    dismissible: (json.dismissible as boolean | undefined) ?? true,
    enabled: (json.enabled as boolean | undefined) ?? true,
  };
}

export type AppAlertResult = 'confirmed' | 'cancelled' | 'dismissed';

export const AppAlertResultLabel: Record<AppAlertResult, string> = {
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  dismissed: 'Fechado sem ação',
};
