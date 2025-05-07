// server.ts
import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import mariadbPool from './mariadb';
import { OkPacket, RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

// API-Handler importieren
import checkQuestionsHandler from './api/database/check-questions';
import checkTableHandler from './api/database/check-table';
import checkTrainingsHandler from './api/database/check-trainings';
import initTrainingsHandler from './api/database/init-trainings';
import insertQuestionsHandler from './api/database/insert-questions';
import initSecurityHandler from './api/init-security-questions';
import trainingProgressHandler from './api/training-progress';
import completedHandler from './api/training-progress/completed';
import trainingQuestionsHandler from './api/training-questions';
import trainingsHandler from './api/trainings';
import withReqHandler from './api/trainings/with-requirements';
import userAnswersHandler from './api/user-answers';
import usersSyncHandler from './api/users/sync';
import createCertificateHandler from './api/certificates/create';

dotenv.config();
const app = express();

/** 1) JSON-Parser */
app.use(express.json());

/** 2) Statisches Verzeichnis für Zertifikate */
app.use(
  '/certs',
  express.static(path.join(__dirname, 'public', 'certs'), {
    maxAge: '1d',
    fallthrough: false
  })
);

/** 3) JSON-Parse-Error-Handler */
const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('[JSON parse error]', err.message);
    res.status(400).json({ error: 'Ungültiges JSON im Request-Body' });
    return;
  }
  next(err);
};
app.use(jsonErrorHandler);

/** 4) Body-Logger */
const bodyLogger: RequestHandler = (req, _res, next) => {
  console.log(`→ ${req.method} ${req.path}`, req.body);
  next();
};
app.use(bodyLogger);

/** 5) Security, CORS, Logging */
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('combined'));

/** 6) Helper für async-Handler */
function asyncHandler(fn: (req: Request, res: Response) => Promise<any>): RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
}

/** ─── ROUTES ──────────────────────────────────────────────────────────── */
// Datenbank-Checks
app.get('/api/database/check-questions',    asyncHandler(checkQuestionsHandler));
app.get('/api/database/check-table',        asyncHandler(checkTableHandler));
app.get('/api/database/check-trainings',    asyncHandler(checkTrainingsHandler));
app.post('/api/database/init-trainings',    asyncHandler(initTrainingsHandler));
app.post('/api/database/insert-questions',  asyncHandler(insertQuestionsHandler));
app.post('/api/init-security-questions',   asyncHandler(initSecurityHandler));

// Trainings & Fragen
app.get('/api/trainings',                   asyncHandler(trainingsHandler));
app.get('/api/trainings/with-requirements', asyncHandler(withReqHandler));
app.get('/api/training-questions',          asyncHandler(trainingQuestionsHandler));

// Fortschritt
app.get('/api/training-progress',           asyncHandler(trainingProgressHandler));
app.post('/api/training-progress',          asyncHandler(trainingProgressHandler));
app.get('/api/training-progress/completed', asyncHandler(completedHandler));

// User-Antworten & Sync
app.post('/api/users/sync',                 asyncHandler(usersSyncHandler));
app.post('/api/user-answers',               asyncHandler(userAnswersHandler));

// Zertifikate
app.post('/api/certificates',               asyncHandler(createCertificateHandler));
app.get(
  '/api/certificates',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ message: 'userId fehlt' });
      return;
    }

    interface CertRow extends RowDataPacket {
      training_id: string;
      issued_at: Date;
      certificate_url: string;
      valid_until: Date | null;
    }

    try {
      const [rows] = await mariadbPool.query<CertRow[]>(
        `SELECT training_id, issued_at, certificate_url, valid_until
         FROM certificates
         WHERE user_id = ?`,
        [userId]
      );
      res.json(rows);
    } catch (err) {
      console.error('Fehler beim Laden der Zertifikate:', err);
      res.status(500).json({ message: 'Fehler beim Laden der Zertifikate' });
    }
  })
);

/** ─── 404-Fallback ────────────────────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/** ─── Globaler Error-Handler ─────────────────────────────────────────────── */
const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
};
app.use(globalErrorHandler);

/** ─── Server starten ───────────────────────────────────────────────────── */
const port = Number(process.env.PORT) || 3002;
app.listen(port, '0.0.0.0', () => {
  console.log(`API "schulung" läuft auf Port ${port}`);
});
