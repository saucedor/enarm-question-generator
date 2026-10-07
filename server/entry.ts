if (process.env.SERVICE_ROLE === 'worker') await import('./worker.js');
else await import('./main.js');
