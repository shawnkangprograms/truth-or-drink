import { getDatabase } from './initDatabase';
import { QuestionCard } from '../types';

export async function getQuestionsForDeck(
  deckId: string,
  intensity: string,
  soberMode: boolean
): Promise<QuestionCard[]> {
  const db = await getDatabase();

  let query = `
    SELECT id, deck_id AS deckId, text_en AS textEn, intensity,
           sober_text AS soberText, sort_order AS sortOrder
    FROM questions
    WHERE deck_id = ?
  `;
  const params: any[] = [deckId];

  if (intensity !== 'Mix All') {
    query += ' AND intensity = ?';
    params.push(intensity.toLowerCase());
  }

  query += ' ORDER BY sort_order ASC';

  const rows = await db.getAllAsync<QuestionCard>(query, params);
  return rows;
}