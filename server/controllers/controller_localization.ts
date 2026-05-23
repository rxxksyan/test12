import { Request, Response } from 'express';

export async function setLocale(req: Request, res: Response) {
  const { lang } = req.body;

  if (!lang || !['ru', 'en'].includes(lang)) {
    return res.status(400).json({ message: 'Unsupported locale' });
  }

  req.session.locale = lang;

  res.json({ message: 'Locale set', lang });
}

export async function getCurrentLocale(req: Request, res: Response) {
  const lang = req.session.locale || null;
  res.json({ lang });
}
