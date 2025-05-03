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
// API-Handler
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
// Umgebungsvariablen laden
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
// Async-Handler Wrapper
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res)).catch(next);
    };
}
// Routen mounten
app.get('/api/database/check-questions', asyncHandler(check_questions_1.default));
app.get('/api/database/check-table', asyncHandler(check_table_1.default));
app.get('/api/database/check-trainings', asyncHandler(check_trainings_1.default));
app.post('/api/database/init-trainings', asyncHandler(init_trainings_1.default));
app.post('/api/database/insert-questions', asyncHandler(insert_questions_1.default));
app.post('/api/init-security-questions', asyncHandler(init_security_questions_1.default));
app.get('/api/training-progress', asyncHandler(training_progress_1.default));
app.post('/api/training-progress', asyncHandler(training_progress_1.default));
app.get('/api/training-progress/completed', asyncHandler(completed_1.default));
app.get('/api/training-questions', asyncHandler(training_questions_1.default));
app.get('/api/trainings', asyncHandler(trainings_1.default));
app.get('/api/trainings/with-requirements', asyncHandler(with_requirements_1.default));
app.post('/api/user-answers', asyncHandler(user_answers_1.default));
app.post('/api/users/sync', asyncHandler(sync_1.default));
// 404-Fallback
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Globaler Fehler-Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
const port = Number(process.env.PORT) || 3002;
app.listen(port, () => {
    console.log(`API "schulung" läuft auf Port ${port}`);
});
