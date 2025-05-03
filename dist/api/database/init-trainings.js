"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mariadb_1 = __importDefault(require("../../mariadb"));
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
    const trainings = req.body.trainings;
    if (!Array.isArray(trainings)) {
        return res.status(400).json({ message: 'Trainings-Array ist erforderlich' });
    }
    try {
        let insertedCount = 0;
        for (const t of trainings) {
            try {
                await mariadb_1.default.execute(`INSERT INTO trainings
             (id, training_id, title, description, duration, question_count, min_pass_percentage)
           VALUES
             (UUID(), ?, ?, ?, ?, ?, ?)`, [
                    t.training_id,
                    t.title,
                    t.description,
                    t.duration,
                    t.question_count,
                    t.min_pass_percentage ?? 80
                ]);
                insertedCount++;
            }
            catch (err) {
                console.error(`Fehler beim Einfügen von ${t.training_id}:`, err);
            }
        }
        return res.status(200).json({ success: true, insertedCount });
    }
    catch (error) {
        console.error('Datenbankfehler:', error);
        return res
            .status(500)
            .json({ message: 'Datenbankfehler', error: error.message });
    }
}
