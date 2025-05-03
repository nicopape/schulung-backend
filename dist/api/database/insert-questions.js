"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const mariadb_1 = __importDefault(require("../../mariadb"));
const uuid_1 = require("uuid");
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
    const questions = req.body.questions;
    if (!Array.isArray(questions)) {
        return res.status(400).json({ message: 'Fragen-Array ist erforderlich' });
    }
    let conn;
    let questionsInserted = 0;
    let optionsInserted = 0;
    try {
        conn = await mariadb_1.default.getConnection();
        await conn.beginTransaction();
        for (const q of questions) {
            const questionId = (0, uuid_1.v4)();
            await conn.execute(`INSERT INTO training_questions 
           (id, training_id, question_text, explanation, question_type) 
         VALUES (?, ?, ?, ?, ?)`, [questionId, q.training_id, q.question_text, q.explanation, q.question_type]);
            questionsInserted++;
            if (Array.isArray(q.options)) {
                for (const opt of q.options) {
                    await conn.execute(`INSERT INTO question_options 
               (id, question_id, option_text, is_correct) 
             VALUES (UUID(), ?, ?, ?)`, [questionId, opt.option_text, opt.is_correct]);
                    optionsInserted++;
                }
            }
        }
        await conn.commit();
        return res
            .status(200)
            .json({ success: true, questionsInserted, optionsInserted });
    }
    catch (error) {
        if (conn)
            await conn.rollback();
        console.error('Datenbankfehler:', error);
        return res
            .status(500)
            .json({ message: 'Datenbankfehler', error: error.message });
    }
    finally {
        if (conn)
            conn.release();
    }
}
