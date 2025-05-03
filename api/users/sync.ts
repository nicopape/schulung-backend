// /var/www/api/schulung/api/users/sync.ts
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import mariadbPool from '../../mariadb';

/**
 * POST /api/users/sync
 * Synchronisiert einen Benutzer (Azure-Auth) in der MariaDB.
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  // Body-Daten entnehmen
  const { id, azure_id, email, display_name } = req.body as {
    id: string;
    azure_id?: string;
    email: string;
    display_name: string;
  };

  // Pflichtfelder prüfen
  if (!id || !email || !display_name) {
    return res
      .status(400)
      .json({ message: 'ID, E-Mail und Anzeigename sind erforderlich' });
  }

  try {
    // Existierenden Benutzer suchen
    const [existing] = await mariadbPool.execute<RowDataPacket[]>(
      `
        SELECT id
          FROM users
         WHERE id = ?
            OR azure_id = ?
            OR email = ?
      `,
      [id, azure_id, email]
    );

    if (existing.length > 0) {
      // Update bestehender Nutzer
      await mariadbPool.execute(
        `
          UPDATE users
             SET azure_id     = ?,
                 email        = ?,
                 display_name = ?,
                 last_login   = NOW()
           WHERE id = ?
        `,
        [azure_id, email, display_name, id]
      );
    } else {
      // Neuen Nutzer anlegen
      await mariadbPool.execute(
        `
          INSERT INTO users
            (id, azure_id, email, display_name, last_login)
          VALUES
            (?, ?, ?, ?, NOW())
        `,
        [id, azure_id, email, display_name]
      );
    }

    // Erfolg zurückgeben
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res
      .status(500)
      .json({ message: 'Datenbankfehler', error: (error as Error).message });
  }
}