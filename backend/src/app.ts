import express, { Request, Response } from 'express';
import { logRequestToFile } from './Middlware/LoggerMid';
import { router as authRouter } from './Routers/Authentication/AuthenticationRouter';
import { router as TeachrRouter } from './Routers/Teacher/TeachrRouter';
import { router as StudentRouter } from './Routers/Student/StudentRouter';
import { errorHandler } from './Middlware/ErrorHendlerMid'
import { myDB } from './Utils/ConnectDB';
const app = express();

// --- CORS & OPTIONS systematic handling ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
// --- END CORS ---

app.use(express.json());
myDB.getDB();
app.use(logRequestToFile);

app.use('/auth', authRouter);
app.use('/teacher', TeachrRouter);
app.use('/student', StudentRouter);

app.use(errorHandler);

export default app;