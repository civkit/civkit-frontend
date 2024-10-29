import { exec } from 'child_process';
import ngrok from 'ngrok';

console.log('Starting Next.js and ngrok...');

// Start the Next.js dev server
const nextProcess = exec('npm run dev');

nextProcess.stdout?.on('data', (data) => {
  console.log(`Next.js: ${data}`);

  if (data.includes('Ready')) {
    console.log('Next.js is ready, starting ngrok...');
    startNgrok();
  }
});

nextProcess.stderr?.on('data', (data) => {
  console.error(`Next.js Error: ${data}`);
});

async function startNgrok() {
  try {
    console.log('Connecting to ngrok...');
    const url = await ngrok.connect({
      addr: 3001,
      authtoken: process.env.NGROK_AUTHTOKEN,
    });
    console.log(`\n\nNgrok tunnel established at: ${url}\n\n`);

    // Log the API URL being used
    console.log(
      `API URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}`
    );
  } catch (error) {
    console.error('Error establishing ngrok tunnel:', error);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await ngrok.kill();
  process.exit(0);
});

console.log('Script setup complete.');
