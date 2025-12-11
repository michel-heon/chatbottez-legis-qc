# Kill processes using ports 3978 and 9239
$ports = @(3978, 9239)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            Write-Host "Killing process $pid on port $port"
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Ports 3978 and 9239 are now free"
Start-Sleep -Seconds 1
