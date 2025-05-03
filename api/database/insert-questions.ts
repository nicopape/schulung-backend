// /var/www/api/schulung/api/database/insert-questions.ts
import type { Request, Response } from 'express';
import mariadbPool from '../../mariadb';
import { v4 as uuidv4 } from 'uuid';

interface Question {
  training_id: string;
  question_text: string;
  explanation: string;
  question_type: 'multiple_choice' | 'single_choice';
  options?: Array<{ option_text: string; is_correct: boolean }>;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const questions = (req.body as any).questions as Question[];
  if (!Array.isArray(questions)) {
    return res.status(400).json({ message: 'Fragen-Array ist erforderlich' });
  }

  let conn;
  let questionsInserted = 0;
  let optionsInserted = 0;

  try {
    conn = await mariadbPool.getConnection();
    await conn.beginTransaction();

    for (const q of questions) {
      const questionId = uuidv4();
      await conn.execute(
        `INSERT INTO training_questions 
           (id, training_id, question_text, explanation, question_type) 
         VALUES (?, ?, ?, ?, ?)`,
        [questionId, q.training_id, q.question_text, q.explanation, q.question_type]
      );
      questionsInserted++;

      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          await conn.execute(
            `INSERT INTO question_options 
               (id, question_id, option_text, is_correct) 
             VALUES (UUID(), ?, ?, ?)`,
            [questionId, opt.option_text, opt.is_correct]
          );
          optionsInserted++;
        }
      }
    }

    await conn.commit();
    return res
      .status(200)
      .json({ success: true, questionsInserted, optionsInserted });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Datenbankfehler:', error);
    return res
      .status(500)
      .json({ message: 'Datenbankfehler', error: (error as Error).message });
  } finally {
    if (conn) conn.release();
  }
}
