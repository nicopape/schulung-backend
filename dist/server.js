"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const mariadb_1 = __importDefault(require("./mariadb"));
// API-Handler importieren
const check_questions_1 = __importDefault(require("./api/database/check-questions"));
const check_table_1 = __importDefault(require("./api/database/check-table"));
const check_trainings_1 = __importDefault(require("./api/database/check-trainings"));
const init_trainings_1 = __importDefault(require("./api/database/init-trainings"));
const insert_questions_1 = __importDefault(require("./api/database/insert-questions"));
const init_security_questions_1 = __importDefault(require("./api/init-security-questions"));
const training_progress_1 = __importDefault(require("./api/training-progress"));
const completed_1 = __importDefault(require("./api/training-progress/completed"));
const training_questions_1 = __importDefault(require("./api/training-questions"));
const trainings_1 = __importDefault(require("./api/trainings"));
const with_requirements_1 = __importDefault(require("./api/trainings/with-requirements"));
const user_answers_1 = __importDefault(require("./api/user-answers"));
const sync_1 = __importDefault(require("./api/users/sync"));
const create_1 = __importDefault(require("./api/certificates/create"));
dotenv_1.default.config();
const app = (0, express_1.default)();
/** 1) JSON-Parser */
app.use(express_1.default.json());
/** 2) Statisches Verzeichnis für Zertifikate */
app.use('/certs', express_1.default.static(path_1.default.join(__dirname, 'public', 'certs'), {
    maxAge: '1d',
    fallthrough: false
}));
/** 3) JSON-Parse-Error-Handler */
const jsonErrorHandler = (err, _req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        console.error('[JSON parse error]', err.message);
        res.status(400).json({ error: 'Ungültiges JSON im Request-Body' });
        return;
    }
    next(err);
};
app.use(jsonErrorHandler);
/** 4) Body-Logger */
const bodyLogger = (req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`, req.body);
    next();
};
app.use(bodyLogger);
/** 5) Security, CORS, Logging */
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, morgan_1.default)('combined'));
/** 6) Helper für async-Handler */
function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res).catch(next);
    };
}
/** ─── ROUTES ──────────────────────────────────────────────────────────── */
// Datenbank-Checks
app.get('/api/database/check-questions', asyncHandler(check_questions_1.default));
app.get('/api/database/check-table', asyncHandler(check_table_1.default));
app.get('/api/database/check-trainings', asyncHandler(check_trainings_1.default));
app.post('/api/database/init-trainings', asyncHandler(init_trainings_1.default));
app.post('/api/database/insert-questions', asyncHandler(insert_questions_1.default));
app.post('/api/init-security-questions', asyncHandler(init_security_questions_1.default));
// Trainings & Fragen
app.get('/api/trainings', asyncHandler(trainings_1.default));
app.get('/api/trainings/with-requirements', asyncHandler(with_requirements_1.default));
app.get('/api/training-questions', asyncHandler(training_questions_1.default));
// Fortschritt
app.get('/api/training-progress', asyncHandler(training_progress_1.default));
app.post('/api/training-progress', asyncHandler(training_progress_1.default));
app.get('/api/training-progress/completed', asyncHandler(completed_1.default));
// User-Antworten & Sync
app.post('/api/users/sync', asyncHandler(sync_1.default));
app.post('/api/user-answers', asyncHandler(user_answers_1.default));
// Zertifikate
app.post('/api/certificates', asyncHandler(create_1.default));
app.get('/api/certificates', asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    if (!userId || typeof userId !== 'string') {
        res.status(400).json({ message: 'userId fehlt' });
        return;
    }
    try {
        const [rows] = await mariadb_1.default.query(`SELECT training_id, issued_at, certificate_url, valid_until
         FROM certificates
         WHERE user_id = ?`, [userId]);
        res.json(rows);
    }
    catch (err) {
        console.error('Fehler beim Laden der Zertifikate:', err);
        res.status(500).json({ message: 'Fehler beim Laden der Zertifikate' });
    }
}));
/** ─── 404-Fallback ────────────────────────────────────────────────────────── */
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
/** ─── Globaler Error-Handler ─────────────────────────────────────────────── */
const globalErrorHandler = (err, _req, res, _next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
};
app.use(globalErrorHandler);
/** ─── Server starten ───────────────────────────────────────────────────── */
const port = Number(process.env.PORT) || 3002;
app.listen(port, '0.0.0.0', () => {
    console.log(`API "schulung" läuft auf Port ${port}`);
});
