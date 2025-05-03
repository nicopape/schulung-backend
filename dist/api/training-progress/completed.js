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
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ message: 'Benutzer-ID ist erforderlich' });
    }
    try {
        const [rows] = await mariadb_1.default.execute('SELECT * FROM training_progress WHERE user_id = ? AND completed = TRUE', [
            userId
        ]);
        return res.status(200).json(rows);
    }
    catch (error) {
        console.error('Datenbankfehler:', error);
        return res.status(500).json({ message: 'Datenbankfehler', error: error.message });
    }
}
