# Exporta o mapeamento dos page layouts customizados da origem e um inventário das páginas.
# Revise o XML gerado em .\mapeamento antes de rodar a migração.

. "$PSScriptRoot\Common.ps1"
Assert-Ambiente
$config = Get-MigradorConfig
$source = Connect-Origem -Config $config

$mappingFolder = Join-Path $PSScriptRoot "mapeamento"
New-Item -ItemType Directory -Path $mappingFolder -Force | Out-Null

Write-Host "Exportando mapeamento de page layouts customizados..." -ForegroundColor Cyan
Export-PnPClientSidePageMapping -CustomPageLayoutMapping -Folder $mappingFolder -Overwrite -Connection $source

Write-Host "Exportando mapeamento padrão (referência)..." -ForegroundColor Cyan
Export-PnPClientSidePageMapping -BuiltInPageLayoutMapping -BuiltInWebPartMapping -Folder $mappingFolder -Overwrite -Connection $source

# Inventário: quais páginas usam quais layouts, para priorizar o mapeamento
$items = Get-PnPListItem -List $config.SourceList -PageSize 500 -Connection $source |
    Where-Object { $_.FieldValues["FSObjType"] -eq 0 -and $_.FieldValues["FileLeafRef"] -like "*.aspx" }

$inventario = foreach ($item in $items) {
    $layout = $item.FieldValues["PublishingPageLayout"]
    [PSCustomObject]@{
        Pagina   = $item.FieldValues["FileLeafRef"]
        Pasta    = $item.FieldValues["FileDirRef"]
        Layout   = if ($layout) { $layout.Description } else { "" }
        Titulo   = $item.FieldValues["Title"]
        Editor   = if ($item.FieldValues["Editor"]) { $item.FieldValues["Editor"].LookupValue } else { "" }
        Alterado = $item.FieldValues["Modified"]
    }
}

$inventarioPath = Join-Path $config.ResultFolder "inventario-paginas.csv"
$inventario | Export-Csv -Path $inventarioPath -NoTypeInformation -Encoding UTF8 -Delimiter ";"

Write-Host ""
Write-Host "Páginas por layout:" -ForegroundColor Green
$inventario | Group-Object Layout | Sort-Object Count -Descending | Format-Table Count, Name -AutoSize

Write-Host "Arquivos gerados em $mappingFolder :" -ForegroundColor Green
Get-ChildItem $mappingFolder | Select-Object Name, Length | Format-Table -AutoSize
Write-Host "Inventário: $inventarioPath"
Write-Host "Próximo passo: revise o XML de layouts customizados e ajuste PageLayoutMapping no config.psd1." -ForegroundColor Yellow
