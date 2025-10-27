// server/src/types/express.d.ts
import { AuthPayload } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
