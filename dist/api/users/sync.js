"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mariadb_1 = __importDefault(require("../../mariadb"));
/**
 * POST /api/users/sync
 * Synchronisiert einen Benutzer (Azure-Auth) in der MariaDB.
 */
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
    // Body-Daten entnehmen
    const { id, azure_id, email, display_name } = req.body;
    // Pflichtfelder prüfen
    if (!id || !email || !display_name) {
        return res
            .status(400)
            .json({ message: 'ID, E-Mail und Anzeigename sind erforderlich' });
    }
    try {
        // Existierenden Benutzer suchen
        const [existing] = await mariadb_1.default.execute(`
        SELECT id
          FROM users
         WHERE id = ?
            OR azure_id = ?
            OR email = ?
      `, [id, azure_id, email]);
        if (existing.length > 0) {
            // Update bestehender Nutzer
            await mariadb_1.default.execute(`
          UPDATE users
             SET azure_id     = ?,
                 email        = ?,
                 display_name = ?,
                 last_login   = NOW()
           WHERE id = ?
        `, [azure_id, email, display_name, id]);
        }
        else {
            // Neuen Nutzer anlegen
            await mariadb_1.default.execute(`
          INSERT INTO users
            (id, azure_id, email, display_name, last_login)
          VALUES
            (?, ?, ?, ?, NOW())
        `, [id, azure_id, email, display_name]);
        }
        // Erfolg zurückgeben
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Datenbankfehler:', error);
        return res
            .status(500)
            .json({ message: 'Datenbankfehler', error: error.message });
    }
}
