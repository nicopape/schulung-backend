"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mariadb_1 = __importDefault(require("../../mariadb"));
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
    const table = req.query.table;
    if (!table) {
        return res.status(400).json({ message: 'Tabellenname ist erforderlich' });
    }
    try {
        const dbName = process.env.DB_NAME;
        // 1) Prüfe, ob die Tabelle im Schema existiert
        const [infoRows] = await mariadb_1.default.execute(`SELECT COUNT(*) AS count
         FROM information_schema.tables
        WHERE table_schema = ? AND table_name = ?`, [dbName, table]);
        const exists = (infoRows[0]?.count ?? 0) > 0;
        if (!exists) {
            // Tabelle existiert gar nicht
            return res.status(200).json({ exists: false, count: 0 });
        }
        // 2) Wenn sie existiert, zähle die Zeilen
        const [countRows] = await mariadb_1.default.execute(`SELECT COUNT(*) AS count FROM \`${table}\``);
        const count = countRows[0]?.count ?? 0;
        return res.status(200).json({ exists: true, count });
    }
    catch (error) {
        console.error('Datenbankfehler in check-table:', error);
        // Bei jedem DB-Error annehmen, dass die Tabelle existiert, um endlose Fehlversuche im Frontend zu verhindern
        return res.status(200).json({ exists: true, count: 0 });
    }
}
