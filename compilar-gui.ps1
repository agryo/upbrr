# compilar-gui.ps1
# Script para compilar o frontend React e gerar o executável Wails na raiz do projeto.

Write-Host "🚀 Iniciando compilação da GUI..." -ForegroundColor Cyan

# Define o diretório raiz do projeto (onde está este script)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Verifica se o diretório gui/frontend existe
if (-not (Test-Path "gui/frontend")) {
    Write-Host "❌ Erro: Diretório 'gui/frontend' não encontrado. Certifique-se de estar na raiz do projeto." -ForegroundColor Red
    exit 1
}

# 1. Entrar no diretório do frontend
Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
Set-Location "gui/frontend"

# 2. pnpm install
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao instalar dependências com pnpm." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 3. pnpm run build
Write-Host "🔨 Construindo o frontend..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao construir o frontend." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 4. Voltar para gui/
Set-Location ..

# 5. wails build
Write-Host "🏗️  Compilando com Wails..." -ForegroundColor Yellow
wails build -o ..\upbrr-gui.exe
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha na compilação Wails." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 6. Voltar para a raiz do projeto
Set-Location ..

# 7. Remover .exe antigo, se existir
$oldExe = "upbrr-gui.exe"
if (Test-Path $oldExe) {
    Write-Host "🗑️  Removendo versão antiga..." -ForegroundColor Yellow
    Remove-Item $oldExe -Force
}

# 8. Mover o novo .exe para a raiz
$sourceExe = "gui\build\upbrr-gui.exe"
if (Test-Path $sourceExe) {
    Write-Host "📦 Movendo novo executável para a raiz..." -ForegroundColor Yellow
    Move-Item -Path $sourceExe -Destination . -Force
    Write-Host "✅ Compilação concluída com sucesso!" -ForegroundColor Green
    Write-Host "📍 Executável disponível em: $(Get-Location)\upbrr-gui.exe" -ForegroundColor Green
} else {
    Write-Host "❌ Executável não encontrado em $sourceExe" -ForegroundColor Red
    exit 1
}
