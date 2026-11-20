import { execSync } from 'node:child_process';

execSync('npx tsc --noEmit && npx vite build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BASE_PATH: '/kaizenos/',
  },
});
