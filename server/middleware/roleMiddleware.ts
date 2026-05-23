import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = req.session as { userId?: string; role?: string };
    if (!session || !session.userId) {
      return res.status(401).json({ message: 'Авторизуйтесь для доступа' });
    }

    if (!session.role || !roles.includes(session.role)) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }

    next();
  };
};
