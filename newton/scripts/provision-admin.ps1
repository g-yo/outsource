$ErrorActionPreference = 'Stop'
$env:ADMIN_USERNAME = Read-Host 'Administrator username'
$newtonPassword = Read-Host 'Unique initial password (at least 16 characters)' -AsSecureString
$newtonPasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($newtonPassword)
try {
  $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($newtonPasswordPointer)
  npm run admin:provision
  if ($LASTEXITCODE -ne 0) { throw 'Administrator provisioning failed.' }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($newtonPasswordPointer)
  Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_USERNAME -ErrorAction SilentlyContinue
}
