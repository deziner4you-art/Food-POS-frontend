<?php
// Secret token to prevent unauthorized access
$secret = "deziner4you-deploy-secret";

if (!isset($_GET['token']) || $_GET['token'] !== $secret) {
    http_response_code(403);
    die("Unauthorized");
}

// Run git commands
$output1 = shell_exec('git fetch --all 2>&1');
$output2 = shell_exec('git reset --hard origin/main 2>&1');

echo "Fetch Output:\n$output1\n\n";
echo "Reset Output:\n$output2\n";
?>
