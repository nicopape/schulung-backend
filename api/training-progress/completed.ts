// /var/www/api/schulung/api/training-progress/completed.ts
import type { Request, Response } from 'express';
import mariadbPool from '../../mariadb';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ message: 'Benutzer-ID ist erforderlich' });
  }

  try {
    const [rows] = await mariadbPool.execute('SELECT * FROM training_progress WHERE user_id = ? AND completed = TRUE', [
      userId
    ]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res.status(500).json({ message: 'Datenbankfehler', error: (error as Error).message });
  }
}
