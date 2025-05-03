// /var/www/api/schulung/api/database/check-table.ts
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import mariadbPool from '../../mariadb';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const table = req.query.table as string;
  if (!table) {
    return res.status(400).json({ message: 'Tabellenname ist erforderlich' });
  }

  try {
    const dbName = process.env.DB_NAME!;
    // 1) Prüfe, ob die Tabelle im Schema existiert
    const [infoRows] = await mariadbPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS count
         FROM information_schema.tables
        WHERE table_schema = ? AND table_name = ?`,
      [dbName, table]
    );
    const exists = (infoRows[0]?.count ?? 0) > 0;

    if (!exists) {
      // Tabelle existiert gar nicht
      return res.status(200).json({ exists: false, count: 0 });
    }

    // 2) Wenn sie existiert, zähle die Zeilen
    const [countRows] = await mariadbPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS count FROM \`${table}\``
    );
    const count = countRows[0]?.count ?? 0;
    return res.status(200).json({ exists: true, count });
  } catch (error) {
    console.error('Datenbankfehler in check-table:', error);
    // Bei jedem DB-Error annehmen, dass die Tabelle existiert, um endlose Fehlversuche im Frontend zu verhindern
    return res.status(200).json({ exists: true, count: 0 });
  }
}
