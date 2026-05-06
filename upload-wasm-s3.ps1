# upload-wasm-s3.ps1
# Faz upload dos arquivos WASM para o bucket S3 com Content-Types corretos
# e aplica a politica de CORS para permitir o dominio de producao.
#
# Pre-requisito: AWS CLI configurado (aws configure)
# Uso: powershell -ExecutionPolicy Bypass -File upload-wasm-s3.ps1

$ErrorActionPreference = 'Stop'

$bucket  = "dataticket-bucket"
$prefix  = "wasm"
$region  = "sa-east-1"
$wasmDir = Join-Path $PSScriptRoot "src\wasm\pdf_generator"

$jsFile   = Join-Path $wasmDir "pdf_wasm.js"
$wasmFile = Join-Path $wasmDir "pdf_wasm_bg.wasm"

if (-not (Test-Path $jsFile) -or -not (Test-Path $wasmFile)) {
    Write-Host "ERRO: Arquivos WASM nao encontrados em $wasmDir" -ForegroundColor Red
    Write-Host "Execute 'npm run build:wasm' antes de fazer o upload." -ForegroundColor Yellow
    exit 1
}

# ── 1. Aplicar CORS no bucket ──────────────────────────────────────────────────
Write-Host "[1/3] Configurando CORS no bucket..." -ForegroundColor Cyan

$corsConfig = @'
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://datasetsistemas.com",
        "https://www.datasetsistemas.com",
        "http://localhost:3000",
        "http://192.168.0.118:3000"
      ],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["Content-Type", "Content-Length"],
      "MaxAgeSeconds": 86400
    }
  ]
}
'@

$tempCors = Join-Path $env:TEMP "cors-wasm.json"
$corsConfig | Out-File -FilePath $tempCors -Encoding UTF8

aws s3api put-bucket-cors `
    --bucket $bucket `
    --cors-configuration "file://$tempCors" `
    --region $region

Remove-Item $tempCors
Write-Host "  CORS configurado." -ForegroundColor Green

# ── 2. Upload pdf_wasm.js ──────────────────────────────────────────────────────
Write-Host "[2/3] Enviando pdf_wasm.js (application/javascript)..." -ForegroundColor Cyan
aws s3 cp $jsFile "s3://$bucket/$prefix/pdf_wasm.js" `
    --content-type "application/javascript" `
    --cache-control "public, max-age=31536000, immutable" `
    --acl public-read `
    --region $region
Write-Host "  OK" -ForegroundColor Green

# ── 3. Upload pdf_wasm_bg.wasm ─────────────────────────────────────────────────
Write-Host "[3/3] Enviando pdf_wasm_bg.wasm (application/wasm)..." -ForegroundColor Cyan
aws s3 cp $wasmFile "s3://$bucket/$prefix/pdf_wasm_bg.wasm" `
    --content-type "application/wasm" `
    --cache-control "public, max-age=31536000, immutable" `
    --acl public-read `
    --region $region
Write-Host "  OK" -ForegroundColor Green

Write-Host ""
Write-Host "Upload concluido!" -ForegroundColor Green
Write-Host "  JS  : https://$bucket.s3.$region.amazonaws.com/$prefix/pdf_wasm.js"
Write-Host "  WASM: https://$bucket.s3.$region.amazonaws.com/$prefix/pdf_wasm_bg.wasm"
