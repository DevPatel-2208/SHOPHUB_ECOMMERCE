$env:NODE_ENV="development"
Set-Location "$PSScriptRoot\backend"
node --env-file=.env server.js
