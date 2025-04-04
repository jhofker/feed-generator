import { createDb, migrateToLatest } from './index';
import dotenv from 'dotenv';

const run = async () => {
  dotenv.config();

  if (!process.env.FEEDGEN_SQLITE_LOCATION) {
    throw new Error('Please provide a SQLite location in the .env file');
  }

  const db = createDb(process.env.FEEDGEN_SQLITE_LOCATION);
  await migrateToLatest(db);
  await db.destroy();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
}); 