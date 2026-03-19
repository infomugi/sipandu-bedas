const { exec } = require('child_process');
exec('echo "Running test"', (err, stdout, stderr) => {
  console.log(stdout);
});
