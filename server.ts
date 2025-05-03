// server.ts
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mariadbPool from './mariadb';

// API-Handler
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
import certificatesHandler from './api/certificates';

// Umgebungsvariablen laden
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('combined'));
app.use(express.json());

// Async-Handler Wrapper
function asyncHandler(
  fn: (req: Request, res: Response) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

// Routen mounten
app.get('/api/database/check-questions', asyncHandler(checkQuestionsHandler));
app.get('/api/database/check-table', asyncHandler(checkTableHandler));
app.get('/api/database/check-trainings', asyncHandler(checkTrainingsHandler));
app.post('/api/database/init-trainings', asyncHandler(initTrainingsHandler));
app.post('/api/database/insert-questions', asyncHandler(insertQuestionsHandler));
app.post('/api/init-security-questions', asyncHandler(initSecurityHandler));
app.get('/api/training-progress', asyncHandler(trainingProgressHandler));
app.post('/api/training-progress', asyncHandler(trainingProgressHandler));
app.get('/api/training-progress/completed', asyncHandler(completedHandler));
app.get('/api/training-questions', asyncHandler(trainingQuestionsHandler));
app.get('/api/trainings', asyncHandler(trainingsHandler));
app.get('/api/trainings/with-requirements', asyncHandler(withReqHandler));
app.post('/api/user-answers', asyncHandler(userAnswersHandler));
app.post('/api/users/sync', asyncHandler(usersSyncHandler));
app.get('/api/certificates', certificatesHandler);

// 404-Fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Globaler Fehler-Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = Number(process.env.PORT) || 3002;
app.listen(port, () => {
  console.log(`API "schulung" läuft auf Port ${port}`);
});
