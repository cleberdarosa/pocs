# Copie este arquivo para config.psd1 e ajuste os valores.
# config.psd1 está no .gitignore — não versione dados do ambiente.
@{
    # ---------- Origem (SharePoint 2016 on-premises) ----------
    SourceUrl          = "https://intranet.empresa.local/sites/portal"
    # Nome da biblioteca de páginas de publishing. Em sites pt-BR costuma ser "Páginas".
    SourceList         = "Pages"
    # "CurrentCredentials" (usuário logado no Windows) ou "Credentials" (pede usuário/senha)
    SourceAuth         = "CurrentCredentials"

    # ---------- Destino (SharePoint Online) ----------
    TargetUrl          = "https://empresa.sharepoint.com/sites/portal"
    # "WebLogin" (login interativo no navegador) ou "Certificate" (app registrado no Entra ID)
    TargetAuth         = "WebLogin"
    # Usados somente quando TargetAuth = "Certificate"
    ClientId           = ""
    Tenant             = "empresa.onmicrosoft.com"
    CertificatePath    = "C:\migracao\cert\migrador.pfx"

    # ---------- Transformação ----------
    # Arquivo gerado por 01-Exportar-Mapeamento.ps1 (depois de revisado)
    PageLayoutMapping  = ".\mapeamento\custompagelayoutmapping.xml"
    # Opcional: CSV de-para de usuários quando o domínio on-prem difere do Entra ID
    UserMappingFile    = ""
    # Opcional: necessário junto com UserMappingFile para resolver usuários no AD on-prem
    LDAPConnectionString = ""
    # Opcional: CSV de-para de URLs (ex.: links antigos -> novos)
    UrlMappingFile     = ""

    Overwrite          = $true
    KeepPageCreationModificationInformation = $true
    # Requer que as colunas customizadas já existam na Site Pages do destino
    CopyPageMetadata   = $false
    # Publica a página no destino após converter
    PublishPage        = $false

    # ---------- Saída ----------
    LogFolder          = ".\logs"
    ResultFolder       = ".\resultados"
}
