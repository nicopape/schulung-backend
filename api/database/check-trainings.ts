// /var/www/api/schulung/api/database/check-trainings.ts
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import mariadbPool from '../../mariadb';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  try {
    const [rows] = await mariadbPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS count FROM trainings'
    );
    return res.status(200).json({ count: rows[0].count });
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res
      .status(500)
      .json({ message: 'Datenbankfehler', error: (error as Error).message });
  }
}
