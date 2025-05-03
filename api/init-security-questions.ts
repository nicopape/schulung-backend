// /var/www/api/schulung/api/init-security-questions.ts
import type { Request, Response } from 'express';
import mariadbPool from '../mariadb';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  try {
    const [result] = await mariadbPool.query('CALL init_security_basics_questions()');
    return res.status(200).json({
      success: true,
      message: 'Sicherheitsgrundlagen-Fragen wurden initialisiert',
      result
    });
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Initialisieren der Sicherheitsgrundlagen-Fragen',
      error: (error as Error).message
    });
  }
}
