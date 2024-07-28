import { Request } from 'express';
import { Session, SessionData } from 'express-session';

export interface IRequestWithUser extends Request {
  session: Session &
    Partial<SessionData> & {
      user?: { _id: string };
    };
  user: {
    id: number;
    email: string;
  };
}
