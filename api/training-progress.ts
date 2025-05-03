// /var/www/api/schulung/api/training-progress.ts
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import mariadbPool from '../mariadb';

export default async function handler(req: Request, res: Response) {
  try {
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      const completed = req.query.completed === 'true';

      if (!userId) {
        return res.status(400).json({ message: 'Benutzer-ID ist erforderlich' });
      }

      let sql = 'SELECT * FROM training_progress WHERE user_id = ?';
      const params: any[] = [userId];
      if (completed) sql += ' AND completed = TRUE';

      const [rows] = await mariadbPool.execute<RowDataPacket[]>(sql, params);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { userId, trainingId, progress, completed = false, score, completedAt } =
        req.body;
      if (!userId || !trainingId || progress == null) {
        return res
          .status(400)
          .json({ message: 'userId, trainingId und progress sind erforderlich' });
      }

      const [existing] = await mariadbPool.execute<RowDataPacket[]>(
        'SELECT 1 FROM training_progress WHERE user_id = ? AND training_id = ?',
        [userId, trainingId]
      );

      if (existing.length) {
        await mariadbPool.execute(
          `UPDATE training_progress
             SET progress = ?, completed = ?, score = ?, completed_at = ?
           WHERE user_id = ? AND training_id = ?`,
          [
            progress,
            completed,
            score ?? null,
            completedAt ?? (completed ? new Date().toISOString() : null),
            userId,
            trainingId
          ]
        );
      } else {
        await mariadbPool.execute(
          `INSERT INTO training_progress
             (id, user_id, training_id, progress, completed, score, completed_at)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            trainingId,
            progress,
            completed,
            score ?? null,
            completed ? new Date().toISOString() : null
          ]
        );
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res
      .status(500)
      .json({ message: 'Datenbankfehler', error: (error as Error).message });
  }
}
