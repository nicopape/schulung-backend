// /var/www/api/schulung/api/training-questions.ts
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import mariadbPool from '../mariadb';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const trainingId = req.query.trainingId as string;
  if (!trainingId) {
    return res.status(400).json({ message: 'Training-ID ist erforderlich' });
  }

  try {
    const [questions] = await mariadbPool.execute<RowDataPacket[]>(
      'SELECT * FROM training_questions WHERE training_id = ?',
      [trainingId]
    );

    const result = await Promise.all(
      questions.map(async (q: RowDataPacket) => {
        const [options] = await mariadbPool.execute<RowDataPacket[]>(
          'SELECT * FROM question_options WHERE question_id = ?',
          [q.id]
        );
        return { ...q, question_options: options };
      })
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res
      .status(500)
      .json({ message: 'Datenbankfehler', error: (error as Error).message });
  }
}
