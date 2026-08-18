const { exec } = require('child_process');

const URL = 'http://localhost:3008';

setTimeout(() => {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║                                          ║');
  console.log('  ║   LumenX AI Comic Platform Ready!        ║');
  console.log('  ║                                          ║');
  console.log('  ║   Frontend:  http://localhost:3008       ║');
  console.log('  ║   Backend:   http://localhost:17177      ║');
  console.log('  ║                                          ║');
  console.log('  ║   Press Ctrl+C to stop all services.     ║');
  console.log('  ║                                          ║');
  console.log('  ╚══════════════════════════════════════════╝\n');

  const cmd = process.platform === 'win32' ? `start "" "${URL}"`
    : process.platform === 'darwin' ? `open "${URL}"`
    : `xdg-open "${URL}"`;
  exec(cmd);
}, 5000);
