<?php
// Secret token to prevent unauthorized access. Must be set in the server's
// environment (e.g. an Apache SetEnv / nginx fastcgi_param / systemd
// Environment= directive on the production host) -- never hardcoded here.
$secret = getenv('DEPLOY_SECRET');

if ($secret === false || $secret === '') {
    http_response_code(500);
    die("Server misconfigured: DEPLOY_SECRET environment variable is not set.");
}

if (!isset($_GET['token']) || !hash_equals($secret, (string) $_GET['token'])) {
    http_response_code(403);
    die("Unauthorized");
}

// Run git commands
$output1 = shell_exec('git fetch --all 2>&1');
$output2 = shell_exec('git reset --hard origin/main 2>&1');

echo "Fetch Output:\n$output1\n\n";
echo "Reset Output:\n$output2\n";
?>
