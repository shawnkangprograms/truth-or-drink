import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'bambika.db';
const DB_DIR = FileSystem.documentDirectory + 'SQLite/';
const DB_PATH = DB_DIR + DB_NAME;
// In production Android APKs, bundled assets are under bundleDirectory
const SEED_ASSET = FileSystem.bundleDirectory + 'assets/db/bambika_seed.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  // Ensure SQLite directory exists
  const dirInfo = await FileSystem.getInfoAsync(DB_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
  }

  // Copy seed database if not already present
  const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!fileInfo.exists) {
    let assetInfo = await FileSystem.getInfoAsync(SEED_ASSET);
    if (!assetInfo.exists) {
      // Fallback for some Android production builds (the path might differ)
      const altAsset = FileSystem.bundleDirectory + 'assets/db/bambika_seed.db';
      assetInfo = await FileSystem.getInfoAsync(altAsset);
    }
    if (!assetInfo.exists) {
      throw new Error(
        'Seed database not found in bundle. Please rebuild the app and ensure assets/db/bambika_seed.db is present.'
      );
    }
    await FileSystem.copyAsync({
      from: assetInfo.uri,
      to: DB_PATH,
    });
    console.log('Seed database copied to', DB_PATH);
  } else {
    console.log('Database already exists at', DB_PATH);
  }

  // Open the database
  dbInstance = await SQLite.openDatabaseAsync(DB_PATH, {
    useNewConnection: true,
  });

  // Enable WAL mode for performance
  await dbInstance.execAsync('PRAGMA journal_mode = WAL');
  console.log('Database opened successfully');

  return dbInstance;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    throw new Error('Database not initialised. Call initDatabase() first.');
  }
  return dbInstance;
}