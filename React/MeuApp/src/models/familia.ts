type Json = Record<string, unknown>;

export interface PlanoFamilia {
  plano: string;
  carteira: string;
  statusCarteira: string;
}

export interface Familia {
  nome: string;
  planos: PlanoFamilia[];
}

export function parsePlanoFamilia(json: Json): PlanoFamilia {
  const carteira = (json.carteira ?? {}) as Json;
  return {
    plano: (json.Plano as string | undefined) ?? '',
    carteira: (carteira.carteira as string | undefined) ?? '',
    statusCarteira: (carteira.stcarteira as string | undefined) ?? '',
  };
}

export function parseFamilia(json: Json): Familia {
  const planos = Array.isArray(json.planos) ? json.planos : [];
  return {
    nome: (json.nm_usuario as string | undefined) ?? '',
    planos: planos.map((item) => parsePlanoFamilia(item as Json)),
  };
}
