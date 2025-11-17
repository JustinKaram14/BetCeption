import { AppDataSource } from '../db/data-source.js';

type Command = 'run' | 'revert' | 'show';

async function main() {
  const command = (process.argv[2] ?? 'run') as Command;

  if (!['run', 'revert', 'show'].includes(command)) {
    console.error(`Unknown migration command "${command}". Use "run", "revert", or "show".`);
    process.exit(1);
  }

  const dataSource = await AppDataSource.initialize();
  try {
    if (command === 'run') {
      const results = await dataSource.runMigrations();
      if (!results.length) {
        console.log('No migrations were executed (already up-to-date).');
      } else {
        for (const result of results) {
          console.log(`Executed migration ${result.name}`);
        }
      }
    } else if (command === 'revert') {
      await dataSource.undoLastMigration();
      console.log('Reverted the last executed migration (if any).');
    } else {
      const hasPending = await dataSource.showMigrations();
      console.log(hasPending ? 'Pending migrations detected.' : 'All migrations have been executed.');
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Migration command failed:', error);
  process.exit(1);
});
