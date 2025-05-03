// /var/www/api/schulung/api/database/check-questions.ts
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import mariadbPool from '../../mariadb';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const trainingId = req.query.trainingId as string;
  if (!trainingId) {
    return res.status(400).json({ message: 'Training-ID ist erforderlich' });
  }

  try {
    const [rows] = await mariadbPool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS count FROM training_questions WHERE training_id = ?',
      [trainingId]
    );
    return res.status(200).json({ count: rows[0].count });
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res
      .status(500)
      .json({ message: 'Datenbankfehler', error: (error as Error).message });
  }
}
