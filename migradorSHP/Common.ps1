# Funções compartilhadas pelos scripts do migrador. Use via dot-source: . "$PSScriptRoot\Common.ps1"

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Ambiente {
    if ($PSVersionTable.PSEdition -ne "Desktop") {
        throw "Execute no Windows PowerShell 5.1 (powershell.exe). O módulo legado SharePointPnPPowerShellOnline não roda no PowerShell 7."
    }
    if (-not (Get-Module -ListAvailable -Name SharePointPnPPowerShellOnline)) {
        throw "Módulo SharePointPnPPowerShellOnline não encontrado. Rode .\00-Instalar-Prerequisitos.ps1."
    }
    # Evita conflito caso o PnP.PowerShell novo também esteja instalado
    Remove-Module PnP.PowerShell -ErrorAction SilentlyContinue
    Import-Module SharePointPnPPowerShellOnline -DisableNameChecking
}

function Get-MigradorConfig {
    param([string]$Path = (Join-Path $PSScriptRoot "config.psd1"))

    if (-not (Test-Path $Path)) {
        throw "Arquivo $Path não encontrado. Copie config.example.psd1 para config.psd1 e ajuste."
    }
    $config = Import-PowerShellDataFile -Path $Path

    # Caminhos relativos são resolvidos a partir da pasta do migrador
    foreach ($key in "PageLayoutMapping", "UserMappingFile", "UrlMappingFile", "LogFolder", "ResultFolder", "CertificatePath") {
        if ($config[$key] -and -not [System.IO.Path]::IsPathRooted($config[$key])) {
            $config[$key] = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot $config[$key]))
        }
    }
    foreach ($folder in $config.LogFolder, $config.ResultFolder) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    return $config
}

function Connect-Origem {
    param([hashtable]$Config)

    Write-Host "Conectando na origem: $($Config.SourceUrl)" -ForegroundColor Cyan
    switch ($Config.SourceAuth) {
        "CurrentCredentials" { Connect-PnPOnline -Url $Config.SourceUrl -CurrentCredentials -ReturnConnection }
        "Credentials"        { Connect-PnPOnline -Url $Config.SourceUrl -Credentials (Get-Credential -Message "Credenciais do SharePoint 2016") -ReturnConnection }
        default              { throw "SourceAuth inválido: $($Config.SourceAuth)" }
    }
}

function Connect-Destino {
    param([hashtable]$Config)

    Write-Host "Conectando no destino: $($Config.TargetUrl)" -ForegroundColor Cyan
    switch ($Config.TargetAuth) {
        "WebLogin" {
            Connect-PnPOnline -Url $Config.TargetUrl -UseWebLogin -ReturnConnection
        }
        "Certificate" {
            $password = Read-Host -AsSecureString "Senha do certificado (Enter se não houver)"
            Connect-PnPOnline -Url $Config.TargetUrl -ClientId $Config.ClientId -Tenant $Config.Tenant `
                -CertificatePath $Config.CertificatePath -CertificatePassword $password -ReturnConnection
        }
        default { throw "TargetAuth inválido: $($Config.TargetAuth)" }
    }
}
