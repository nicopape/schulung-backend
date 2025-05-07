// /var/www/api/schulung/api/certificates.ts

import { Request, Response } from 'express';
import mariadbPool from '../mariadb';
import { RowDataPacket } from 'mysql2';

interface CertificateRow extends RowDataPacket {
  training_id: string;
  issued_at: Date;
  certificate_url: string;
  valid_until: Date | null;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const userId = req.query.userId as string | undefined;
  if (!userId) {
    return res.status(400).json({ message: 'userId fehlt' });
  }

  try {
    // Tipisiere das Ergebnis als CertificateRow[]
    const [rows] = await mariadbPool.query<CertificateRow[]>(
      `SELECT training_id, issued_at, certificate_url, valid_until
       FROM certificates
       WHERE user_id = ?`,
      [userId]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Fehler beim Laden der Zertifikate:', error);
    return res.status(500).json({ message: 'Fehler beim Laden der Zertifikate' });
  }
}
