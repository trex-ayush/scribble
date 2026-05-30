import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import router from './routes/index.js';
import publicRouter from './routes/public.routes.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.isDev) app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  // Rate limiting is for production abuse protection; in development the
  // StrictMode double-mounts + auth checks would exhaust it during normal use.
  skip: () => env.isDev,
});
app.use('/api', limiter);

// Public API (Basic Auth) must be mounted BEFORE the web router so that
// requests with Basic Auth are handled here; JWT requests pass through
// via next('router') and are handled by the web router below.
app.use('/api/v1', publicRouter);
app.use('/api/v1', router);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
