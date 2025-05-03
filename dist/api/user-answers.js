"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mariadb_1 = __importDefault(require("../mariadb"));
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
    const { userId, questionId, selectedOptionId, isCorrect } = req.body;
    if (!userId || !questionId || !selectedOptionId || isCorrect == null) {
        return res.status(400).json({
            message: 'Benutzer-ID, Frage-ID, ausgewählte Option-ID und Korrektheit sind erforderlich'
        });
    }
    try {
        await mariadb_1.default.execute(`INSERT INTO user_answers
         (id, user_id, question_id, selected_option_id, is_correct)
       VALUES (UUID(), ?, ?, ?, ?)`, [userId, questionId, selectedOptionId, isCorrect]);
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Datenbankfehler:', error);
        return res
            .status(500)
            .json({ message: 'Datenbankfehler', error: error.message });
    }
}
