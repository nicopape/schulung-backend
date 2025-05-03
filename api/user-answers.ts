// /var/www/api/schulung/api/user-answers.ts
import type { Request, Response } from 'express';
import mariadbPool from '../mariadb';

interface Body {
  userId: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const { userId, questionId, selectedOptionId, isCorrect } =
    req.body as Body;
  if (!userId || !questionId || !selectedOptionId || isCorrect == null) {
    return res.status(400).json({
      message:
        'Benutzer-ID, Frage-ID, ausgewählte Option-ID und Korrektheit sind erforderlich'
    });
  }

  try {
    await mariadbPool.execute(
      `INSERT INTO user_answers
         (id, user_id, question_id, selected_option_id, is_correct)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [userId, questionId, selectedOptionId, isCorrect]
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res
      .status(500)
      .json({ message: 'Datenbankfehler', error: (error as Error).message });
  }
}
