<#
.SYNOPSIS
    Converte páginas de publishing do SharePoint 2016 em páginas modernas no SharePoint Online.

.EXAMPLE
    .\02-Migrar-Paginas.ps1 -Pagina "home.aspx"
    Migra uma única página (use para testar o mapeamento).

.EXAMPLE
    .\02-Migrar-Paginas.ps1
    Migra todas as páginas da biblioteca.

.EXAMPLE
    .\02-Migrar-Paginas.ps1 -SomenteFalhas
    Reprocessa apenas as páginas que falharam na última execução.
#>
[CmdletBinding()]
param(
    [string[]]$Pagina,
    [switch]$SomenteFalhas
)

. "$PSScriptRoot\Common.ps1"
Assert-Ambiente
$config = Get-MigradorConfig

if (-not (Test-Path $config.PageLayoutMapping)) {
    throw "Mapeamento não encontrado: $($config.PageLayoutMapping). Rode .\01-Exportar-Mapeamento.ps1 e ajuste o config.psd1."
}

$ultimoRelatorio = Join-Path $config.ResultFolder "ultimo-relatorio.csv"

$source = Connect-Origem -Config $config
$target = Connect-Destino -Config $config

# ---------- Seleciona as páginas ----------
$listRoot = (Get-PnPList -Identity $config.SourceList -Includes RootFolder -Connection $source).RootFolder.ServerRelativeUrl
$items = Get-PnPListItem -List $config.SourceList -PageSize 500 -Connection $source |
    Where-Object { $_.FieldValues["FSObjType"] -eq 0 -and $_.FieldValues["FileLeafRef"] -like "*.aspx" }

if ($SomenteFalhas) {
    if (-not (Test-Path $ultimoRelatorio)) { throw "Nenhum relatório anterior encontrado em $ultimoRelatorio." }
    $falhas = Import-Csv $ultimoRelatorio -Delimiter ";" | Where-Object Status -eq "Erro" | ForEach-Object { $_.Arquivo }
    $items = $items | Where-Object { $falhas -contains $_.FieldValues["FileRef"] }
}
elseif ($Pagina) {
    $items = $items | Where-Object { $Pagina -contains $_.FieldValues["FileLeafRef"] }
}

$items = @($items)
if ($items.Count -eq 0) {
    Write-Warning "Nenhuma página selecionada."
    return
}
Write-Host "Páginas a migrar: $($items.Count)" -ForegroundColor Cyan

# ---------- Parâmetros comuns da transformação ----------
$convertParams = @{
    PublishingPage    = $true
    PageLayoutMapping = $config.PageLayoutMapping
    TargetConnection  = $target
    Connection        = $source
    LogType           = "File"
    LogFolder         = $config.LogFolder
    LogSkipFlush      = $true
}
if ($config.Overwrite)                                { $convertParams.Overwrite = $true }
if ($config.KeepPageCreationModificationInformation)  { $convertParams.KeepPageCreationModificationInformation = $true }
if ($config.CopyPageMetadata)                         { $convertParams.CopyPageMetadata = $true }
if ($config.PublishPage)                              { $convertParams.PublishPage = $true }
if ($config.UserMappingFile)                          { $convertParams.UserMappingFile = $config.UserMappingFile }
if ($config.LDAPConnectionString)                     { $convertParams.LDAPConnectionString = $config.LDAPConnectionString }
if ($config.UrlMappingFile)                           { $convertParams.UrlMappingFile = $config.UrlMappingFile }

# ---------- Migração ----------
$relatorio = New-Object System.Collections.Generic.List[object]
$i = 0

foreach ($item in $items) {
    $i++
    $fileName = $item.FieldValues["FileLeafRef"]
    $fileRef  = $item.FieldValues["FileRef"]
    # Subpasta dentro da biblioteca (vazio quando a página está na raiz)
    $folder   = $item.FieldValues["FileDirRef"].Substring($listRoot.Length).TrimStart("/")

    Write-Progress -Activity "Migrando páginas" -Status "$i de $($items.Count): $fileName" -PercentComplete ($i / $items.Count * 100)

    $params = $convertParams.Clone()
    $params.Identity = $fileName
    if ($folder) { $params.Folder = $folder }

    $inicio = Get-Date
    try {
        $resultado = ConvertTo-PnPClientSidePage @params
        $relatorio.Add([PSCustomObject]@{
            Arquivo    = $fileRef
            Status     = "OK"
            UrlDestino = "$resultado"
            Mensagem   = ""
            Segundos   = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
        })
        Write-Host "[$i/$($items.Count)] OK    $fileRef" -ForegroundColor Green
    }
    catch {
        $relatorio.Add([PSCustomObject]@{
            Arquivo    = $fileRef
            Status     = "Erro"
            UrlDestino = ""
            Mensagem   = $_.Exception.Message
            Segundos   = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
        })
        Write-Host "[$i/$($items.Count)] ERRO  $fileRef - $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Progress -Activity "Migrando páginas" -Completed

# Grava o log detalhado da transformação (web parts não mapeadas, URLs reescritas etc.)
Save-PnPClientSidePageConversionLog

# ---------- Relatório ----------
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$relatorioPath = Join-Path $config.ResultFolder "relatorio-$timestamp.csv"
$relatorio | Export-Csv -Path $relatorioPath -NoTypeInformation -Encoding UTF8 -Delimiter ";"

# Ao reprocessar, mescla com o relatório anterior para que ultimo-relatorio.csv reflita o estado atual de todas as páginas
if ($SomenteFalhas -or $Pagina) {
    $anterior = if (Test-Path $ultimoRelatorio) { @(Import-Csv $ultimoRelatorio -Delimiter ";") } else { @() }
    $atualizados = $relatorio | ForEach-Object { $_.Arquivo }
    $mesclado = @($anterior | Where-Object { $atualizados -notcontains $_.Arquivo }) + $relatorio
    $mesclado | Export-Csv -Path $ultimoRelatorio -NoTypeInformation -Encoding UTF8 -Delimiter ";"
}
else {
    Copy-Item $relatorioPath $ultimoRelatorio -Force
}

$ok   = @($relatorio | Where-Object Status -eq "OK").Count
$erro = @($relatorio | Where-Object Status -eq "Erro").Count
Write-Host ""
Write-Host "Concluído: $ok OK, $erro com erro." -ForegroundColor $(if ($erro) { "Yellow" } else { "Green" })
Write-Host "Relatório: $relatorioPath"
Write-Host "Logs da transformação: $($config.LogFolder)"
if ($erro) { Write-Host "Para reprocessar as falhas: .\02-Migrar-Paginas.ps1 -SomenteFalhas" -ForegroundColor Yellow }
