import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const LOCALES_DIR = path.join(__dirname, '../locales');

export async function getLocale(req: Request, res: Response) {
  const lang = String(req.params.lang);

  if (!lang || !['ru', 'en'].includes(lang)) {
    return res.status(400).json({ message: 'Unsupported locale' });
  }

  try {
    const filePath = path.join(LOCALES_DIR, `${lang}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const locale = JSON.parse(data);
    res.json({ lang, locale });
  } catch {
    res.status(500).json({ message: 'Failed to load locale' });
  }
}

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
