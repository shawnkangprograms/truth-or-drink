import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';

const DB_NAME = 'bambika.db';

const DB_DIR = FileSystem.documentDirectory + 'SQLite/';
const DB_PATH = DB_DIR + DB_NAME;

// Load bundled database asset properly
const seedAsset = Asset.fromModule(
  require('../assets/db/bambika_seed.db')
);

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    if (dbInstance) {
      return dbInstance;
    }

    // ---------------------------------------------------
    // STEP 1: Ensure SQLite folder exists
    // ---------------------------------------------------

    const dirInfo = await FileSystem.getInfoAsync(DB_DIR);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DB_DIR, {
        intermediates: true,
      });
    }

    // ---------------------------------------------------
    // STEP 2: Check if database already exists
    // ---------------------------------------------------

    const dbInfo = await FileSystem.getInfoAsync(DB_PATH);

    if (!dbInfo.exists) {
      console.log('Copying seed database...');

      // Ensure asset is downloaded/extracted
      await seedAsset.downloadAsync();

      if (!seedAsset.localUri) {
        throw new Error('Seed database asset could not be loaded');
      }

      // Copy bundled DB into SQLite directory
      await FileSystem.copyAsync({
        from: seedAsset.localUri,
        to: DB_PATH,
      });

      console.log('Seed database copied');
    }

    // ---------------------------------------------------
    // STEP 3: Open database
    // ---------------------------------------------------

    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);

    await dbInstance.execAsync(`
      PRAGMA journal_mode = WAL;
    `);

    console.log('Database opened successfully');

    return dbInstance;

  } catch (error) {
    console.error('DATABASE INIT ERROR:', error);
    throw error;
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized. Call initDatabase() first.'
    );
  }

  return dbInstance;
}