import { execSync } from 'child_process';

const POLL_INTERVAL_MS = 5000;
const DEBOUNCE_WAIT_MS = 4000;

console.log('====================================================');
console.log('  Restro Auto-Push & Auto-Deploy Watcher Started');
console.log('  Repository: calculatorspoint-ops/Restro');
console.log('  Branch: master -> Vercel Auto Deploy');
console.log('====================================================');
console.log(`[${new Date().toLocaleTimeString()}] Watching for changes...`);

let isSyncing = false;

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function checkAndSync() {
  if (isSyncing) return;

  try {
    const status = run('git status --porcelain');
    if (!status) {
      return;
    }

    isSyncing = true;
    console.log(`\n[${new Date().toLocaleTimeString()}] Detected changes in project files.`);
    console.log('Waiting briefly for edits to settle...');

    setTimeout(() => {
      try {
        const currentStatus = run('git status --porcelain');
        if (!currentStatus) {
          isSyncing = false;
          return;
        }

        const changedCount = currentStatus.split('\n').filter(Boolean).length;
        const commitMessage = `Auto-sync: update ${changedCount} file(s) - ${new Date().toLocaleString()}`;

        console.log(`[${new Date().toLocaleTimeString()}] Staging ${changedCount} file(s)...`);
        run('git add -A');

        console.log(`[${new Date().toLocaleTimeString()}] Committing changes...`);
        run(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

        console.log(`[${new Date().toLocaleTimeString()}] Pushing to GitHub (origin/master)...`);
        run('git push origin master');

        console.log(`[${new Date().toLocaleTimeString()}] SUCCESS: Pushed to GitHub!`);
        console.log('🚀 Vercel will automatically detect the push and deploy.');
      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error during auto-sync:`, err.message || err);
      } finally {
        isSyncing = false;
        console.log(`[${new Date().toLocaleTimeString()}] Watching for next changes...\n`);
      }
    }, DEBOUNCE_WAIT_MS);

  } catch (err) {
    isSyncing = false;
  }
}

setInterval(checkAndSync, POLL_INTERVAL_MS);
checkAndSync();
