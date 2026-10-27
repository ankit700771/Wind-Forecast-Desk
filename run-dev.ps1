# Starts the FastAPI backend (:8001) and the React dev server (:5173) in separate windows.
# Usage (from the project root):  .\run-dev.ps1
$root = $PSScriptRoot

if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..."
    Push-Location "$root\frontend"; npm install; Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn app.main:app --reload --port 8001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "Backend:  http://localhost:8001/docs"
Write-Host "Frontend: http://localhost:5173"
Start-Sleep -Seconds 4
Start-Process "http://localhost:5173"
