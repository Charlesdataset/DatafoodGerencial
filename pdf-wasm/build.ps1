# build.ps1 - Compila o crate Rust para WebAssembly usando wasm-pack.
# Saida: src/wasm/pdf_generator/

$ErrorActionPreference = 'Stop'

$scriptDir  = $PSScriptRoot
$projectDir = Split-Path $scriptDir -Parent
$outDir     = Join-Path $projectDir 'src\wasm\pdf_generator'

# Garantir que o cargo bin esteja no PATH desta sessao PowerShell
# (necessario quando o npm script abre uma sessao nova sem herdar o PATH do usuario)
$cargoBin = "$env:USERPROFILE\.cargo\bin"
if ((Test-Path $cargoBin) -and ($env:PATH -notlike "*$cargoBin*")) {
    $env:PATH = "$cargoBin;$env:PATH"
    Write-Host "  Cargo bin adicionado ao PATH: $cargoBin" -ForegroundColor DarkGray
}

Write-Host "[1/4] Verificando pre-requisitos..." -ForegroundColor Cyan

if (-not (Get-Command rustup -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "ERRO: Rust nao encontrado." -ForegroundColor Red
    Write-Host "  1. Acesse https://rustup.rs e baixe o instalador" -ForegroundColor Yellow
    Write-Host "  2. Execute o instalador (opcao padrao)" -ForegroundColor Yellow
    Write-Host "  3. Feche e reabra o terminal" -ForegroundColor Yellow
    Write-Host "  4. Execute 'npm run build:wasm' novamente" -ForegroundColor Yellow
    exit 1
}

$targets = rustup target list --installed 2>&1
if ($targets -notmatch 'wasm32-unknown-unknown') {
    Write-Host "[2/4] Adicionando target wasm32-unknown-unknown..." -ForegroundColor Yellow
    rustup target add wasm32-unknown-unknown
} else {
    Write-Host "[2/4] Target wasm32-unknown-unknown: OK" -ForegroundColor Green
}

if (-not (Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
    Write-Host "[3/4] Instalando wasm-pack via cargo (aguarde ~2 min)..." -ForegroundColor Yellow
    cargo install wasm-pack
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","User") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","Machine")
} else {
    Write-Host "[3/4] wasm-pack: OK" -ForegroundColor Green
}

Write-Host "[4/4] Compilando Rust -> WASM (release)..." -ForegroundColor Cyan
Write-Host "      Entrada : $scriptDir"
Write-Host "      Saida   : $outDir"

wasm-pack build $scriptDir --target web --release --out-dir $outDir --out-name pdf_wasm

if ($LASTEXITCODE -ne 0) { Write-Error "Build falhou (exit $LASTEXITCODE)"; exit $LASTEXITCODE }

$pkgJson = Join-Path $outDir 'package.json'
if (Test-Path $pkgJson) { Remove-Item $pkgJson }

Write-Host "Build concluido!" -ForegroundColor Green
Get-ChildItem $outDir | Select-Object Name, @{N='KB';E={ "{0:N1}" -f ($_.Length/1KB) }} | Format-Table -AutoSize
