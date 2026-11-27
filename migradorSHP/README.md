# migradorSHP

Converte páginas de publishing (biblioteca **Pages**) do **SharePoint 2016 on-premises** em **páginas modernas** na biblioteca **Site Pages** do **SharePoint Online**, usando a Page Transformation do PnP.

## Por que o módulo legado

O `PnP.PowerShell` atual só conecta no SharePoint Online. Para ler a origem on-premises é preciso o módulo legado **`SharePointPnPPowerShellOnline`** (arquivado, mas ainda é o caminho documentado para on-prem → Online). Ele só roda no **Windows PowerShell 5.1**.

## Estrutura

| Arquivo | Função |
|---|---|
| `config.example.psd1` | Modelo de configuração (copie para `config.psd1`) |
| `Common.ps1` | Funções compartilhadas (config, conexões) |
| `00-Instalar-Prerequisitos.ps1` | Instala o módulo legado do PnP |
| `01-Exportar-Mapeamento.ps1` | Exporta o mapeamento dos page layouts e um inventário das páginas |
| `02-Migrar-Paginas.ps1` | Faz a conversão e gera um relatório em CSV |
| `usermapping.example.csv` | Modelo de de-para de usuários (opcional) |

## Pré-requisitos

- Máquina Windows com acesso de rede ao SharePoint 2016 e ao SharePoint Online
- Conta com permissão de leitura no site de origem e de owner no destino
- Site de destino já criado no SPO (recomendado: **Communication Site**)

## Passo a passo

```powershell
# 1. Instalar o módulo (uma vez)
.\00-Instalar-Prerequisitos.ps1

# 2. Configurar
Copy-Item config.example.psd1 config.psd1
notepad config.psd1

# 3. Exportar mapeamento + inventário
.\01-Exportar-Mapeamento.ps1
```

Revise o XML de layouts customizados em `mapeamento\`. Ele define como cada campo do page layout (título, conteúdo, imagem, web part zones) vira seção e web part na página moderna. Ajuste `PageLayoutMapping` no `config.psd1` com o nome do arquivo gerado. O `resultados\inventario-paginas.csv` mostra quais layouts são mais usados, então comece o mapeamento por eles.

```powershell
# 4. Testar com uma página e validar no SPO
.\02-Migrar-Paginas.ps1 -Pagina "home.aspx"

# 5. Migrar todas
.\02-Migrar-Paginas.ps1

# 6. Reprocessar só as que falharam
.\02-Migrar-Paginas.ps1 -SomenteFalhas
```

## Saídas

- `resultados\relatorio-<data>.csv`: resultado de cada execução
- `resultados\ultimo-relatorio.csv`: estado consolidado, usado pelo `-SomenteFalhas`
- `logs\`: log detalhado da transformação (web parts não mapeadas, URLs reescritas etc.)

## Autenticação no SharePoint Online

- **WebLogin**: login interativo no navegador. É o mais simples para uma POC.
- **Certificate**: app registrado no Entra ID com certificado (o app "PnP Management Shell" foi descontinuado em 2024). Preencha `ClientId`, `Tenant` e `CertificatePath`.

## Usuários de domínios diferentes

Se as contas do AD on-prem não batem com as do Entra ID, copie `usermapping.example.csv` para `usermapping.csv` e preencha o de-para. Depois configure `UserMappingFile` e `LDAPConnectionString` no `config.psd1`.

## Limitações conhecidas

- Web parts customizadas (farm solutions), Script Editor e Content Editor com JavaScript não convertem
- Navegação, master page e branding precisam ser refeitos no modelo moderno
- Subpastas da biblioteca de origem são lidas, mas confira onde as páginas ficam na Site Pages do destino
- Metadados customizados (`CopyPageMetadata`) exigem que as colunas existam antes no destino

> Parâmetros baseados na documentação do módulo legado. Na dúvida, valide com `Get-Help ConvertTo-PnPClientSidePage -Full`.
