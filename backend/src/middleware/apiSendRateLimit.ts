import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

type WindowEntry = {
  windowStart: number;
  count: number;
};

const windows = new Map<string, WindowEntry>();

const apiSendRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return next(
      new AppError("ERR_INVALID_API_TOKEN", 401)
    );
  }

  const raw = auth.slice("Bearer ".length).trim();
  if (!raw) {
    return next(new AppError("ERR_INVALID_API_TOKEN", 401));
  }

  const now = Date.now();
  let entry = windows.get(raw);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    entry = { windowStart: now, count: 0 };
  }

  entry.count += 1;
  windows.set(raw, entry);

  if (entry.count > MAX_REQUESTS) {
    return next(new AppError("ERR_RATE_LIMIT_EXCEEDED", 429));
  }

  return next();
};

export default apiSendRateLimit;
