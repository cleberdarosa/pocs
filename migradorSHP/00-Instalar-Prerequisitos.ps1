# Instala o módulo legado do PnP, necessário para ler páginas do SharePoint on-premises.
# Execute no Windows PowerShell 5.1.

if ($PSVersionTable.PSEdition -ne "Desktop") {
    throw "Execute no Windows PowerShell 5.1 (powershell.exe), não no PowerShell 7."
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not (Get-PackageProvider -ListAvailable -Name NuGet -ErrorAction SilentlyContinue)) {
    Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Scope CurrentUser -Force
}

Install-Module SharePointPnPPowerShellOnline -Scope CurrentUser -AllowClobber -Force

Get-Module -ListAvailable SharePointPnPPowerShellOnline | Select-Object Name, Version, Path
