const { spawn } = require('child_process');

// Extract optional description from arguments
const descriptionArg = process.argv.slice(2).join(' ').trim();

console.log("Running check-zalo-env...");
const check = spawn('node', ['scripts/check-zalo-env.mjs'], { stdio: 'inherit' });

check.on('close', (code) => {
  if (code !== 0) {
    console.error("Check env failed. Aborting deploy.");
    process.exit(code);
  }

  console.log("Starting zmp deploy (Automatic selection of Testing)...");
  const deploy = spawn('npx', ['zmp', 'deploy'], { shell: true });

  // Pipe stdin so user can type interactively if no description argument is provided
  if (!descriptionArg) {
    process.stdin.pipe(deploy.stdin);
  }

  let arrowSent = false;
  let descSent = false;

  deploy.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(data);

    // Auto-select "Testing" option
    if (text.includes("What version status are you deploying?") && !arrowSent) {
      arrowSent = true;
      setTimeout(() => {
        deploy.stdin.write('\u001b[B\n');
      }, 500);
    }

    // Auto-fill description if provided in command args
    if (text.includes("Description:") && descriptionArg && !descSent) {
      descSent = true;
      setTimeout(() => {
        deploy.stdin.write(descriptionArg + '\n');
      }, 500);
    }
  });

  deploy.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  deploy.on('close', (deployCode) => {
    process.exit(deployCode);
  });
});
