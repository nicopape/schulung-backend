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
    const trainingId = req.query.trainingId;
    if (!trainingId) {
        return res.status(400).json({ message: 'Training-ID ist erforderlich' });
    }
    try {
        const [rows] = await mariadb_1.default.execute('SELECT COUNT(*) AS count FROM training_questions WHERE training_id = ?', [trainingId]);
        return res.status(200).json({ count: rows[0].count });
    }
    catch (error) {
        console.error('Datenbankfehler:', error);
        return res
            .status(500)
            .json({ message: 'Datenbankfehler', error: error.message });
    }
}
