import express from 'express';
import session from 'express-session';
import path from 'path';
import authRoutes from './routes/auth';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    locale: string;
    role: string;
    recommendationsAt?: number;
  }
}

const app = express();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret-key-wot-shop-2026',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600000
  }
}));

app.use('/api/auth', authRoutes);

import catalogRoutes from './routes/route_catalog';
import cartRoutes from './routes/route_cart';
import deliveryRoutes from './routes/route_delivery';

app.use('/api/catalog', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/delivery', deliveryRoutes);

import localeRoutes from './routes/route_locale';
app.use('/api/locale', localeRoutes);

app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

export default app;
