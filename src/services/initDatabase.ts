import * as SQLite from 'expo-sqlite';
import { Directory, File, Paths } from 'expo-file-system/next';
import { Asset } from 'expo-asset';

const DB_NAME = 'bambika.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const dbDir = new Directory(Paths.document, 'SQLite');
  if (!dbDir.exists) {
    dbDir.create();
  }

  const dbFile = new File(dbDir, DB_NAME);

  if (!dbFile.exists) {
    const asset = Asset.fromModule(require('../../assets/db/bambika_seed.db'));
    await asset.downloadAsync();

    const seedFile = new File(asset.localUri!);
    seedFile.copy(dbFile);
  }

  dbInstance = await SQLite.openDatabaseAsync(dbFile.uri, {
    useNewConnection: true,
  });

  await dbInstance.execAsync('PRAGMA journal_mode = WAL;');

  if (!dbInstance) {
    throw new Error('Database not initialised. Call initDatabase() first.');
  }
  return dbInstance;
}