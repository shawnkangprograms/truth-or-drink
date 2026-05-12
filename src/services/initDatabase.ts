import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'bambika.db';

// Expo automatically stores SQLite databases in the SQLite directory,
// so we only need the database name when opening it.
const DB_DIR = FileSystem.documentDirectory + 'SQLite/';
const DB_PATH = DB_DIR + DB_NAME;

// Location of the bundled seed database inside assets
const SEED_ASSET = FileSystem.bundleDirectory + 'assets/db/bambika_seed.db';

// Store a single reusable database connection
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Prevent opening multiple connections
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

    console.log('SQLite directory created');
  }

  // ---------------------------------------------------
  // STEP 2: Check if database already exists
  // ---------------------------------------------------

  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);

  if (!dbInfo.exists) {
    console.log('Database not found locally');

    // ---------------------------------------------------
    // STEP 3: Verify bundled seed database exists
    // ---------------------------------------------------

    const seedInfo = await FileSystem.getInfoAsync(SEED_ASSET);

    if (!seedInfo.exists) {
      throw new Error(
        'Seed database missing. Make sure assets/db/bambika_seed.db exists and rebuild the app.'
      );
    }

    // ---------------------------------------------------
    // STEP 4: Copy seed database into app storage
    // ---------------------------------------------------

    await FileSystem.copyAsync({
      from: seedInfo.uri,
      to: DB_PATH,
    });

    console.log('Seed database copied successfully');
  } else {
    console.log('Existing database found');
  }

  // ---------------------------------------------------
  // STEP 5: Open SQLite database
  // ---------------------------------------------------

  // Use DB_NAME instead of full DB_PATH because
  // Expo handles the SQLite directory internally.
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);

  // ---------------------------------------------------
  // STEP 6: Enable WAL mode
  // ---------------------------------------------------

  // WAL improves performance and concurrency
  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
  `);

  console.log('Database opened successfully');

  return dbInstance;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized. Call initDatabase() first.'
    );
  }

  return dbInstance;
}