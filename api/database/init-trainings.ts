// /var/www/api/schulung/api/database/init-trainings.ts
import type { Request, Response } from 'express';
import mariadbPool from '../../mariadb';

interface Training {
  training_id: string;
  title: string;
  description: string;
  duration: string;
  question_count: number;
  min_pass_percentage?: number;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const trainings = (req.body as any).trainings as Training[];
  if (!Array.isArray(trainings)) {
    return res.status(400).json({ message: 'Trainings-Array ist erforderlich' });
  }

  try {
    let insertedCount = 0;
    for (const t of trainings) {
      try {
        await mariadbPool.execute(
          `INSERT INTO trainings
             (id, training_id, title, description, duration, question_count, min_pass_percentage)
           VALUES
             (UUID(), ?, ?, ?, ?, ?, ?)`,
          [
            t.training_id,
            t.title,
            t.description,
            t.duration,
            t.question_count,
            t.min_pass_percentage ?? 80
          ]
        );
        insertedCount++;
      } catch (err) {
        console.error(`Fehler beim Einfügen von ${t.training_id}:`, err);
      }
    }
    return res.status(200).json({ success: true, insertedCount });
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res
      .status(500)
      .json({ message: 'Datenbankfehler', error: (error as Error).message });
  }
}
