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
    try {
        const [result] = await mariadb_1.default.query('CALL init_security_basics_questions()');
        return res.status(200).json({
            success: true,
            message: 'Sicherheitsgrundlagen-Fragen wurden initialisiert',
            result
        });
    }
    catch (error) {
        console.error('Datenbankfehler:', error);
        return res.status(500).json({
            success: false,
            message: 'Fehler beim Initialisieren der Sicherheitsgrundlagen-Fragen',
            error: error.message
        });
    }
}
