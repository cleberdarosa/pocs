export const ApiConstants = {
  baseUrl: 'https://api-hml.unimedpoa.com.br',

  authorization: '/uniId/v1/authorization',

  accessToken: '/controle-acesso-sistemas/v1/access-token',

  redirectUri: 'aHR0cHM6Ly91bmltZWRwb2EtdGVzdC5vdXRzeXN0ZW1zLmFwcA==',

  clientId: '644fff4ad5b158b21fd7c84e9e6f5cf3',

  // TODO: segredo do cliente embarcado no app (herdado do projeto Flutter).
  // O ideal é que essa troca de token aconteça em um backend (BFF).
  xAuthorization:
    'NjQ0ZmZmNGFkNWIxNThiMjFmZDdjODRlOWU2ZjVjZjM6YThlZjc1MDNiZTVmMjAwMmY4Mzg0ZGE1NzZjYjQxYWE=',

  familia: (cpf: string) => `/uniid/beneficiario/v1/beneficiarios/${cpf}/familia/agrupados`,
} as const;
