import { Session, SessionData } from 'express-session';
import { Request } from 'express';

export interface CustomRequest extends Request {
  session: Session &
    Partial<SessionData> & { user: { _id?: string; email?: string } };
}
