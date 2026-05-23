import express from 'express';
import session from 'express-session';
import path from 'path';
import authRoutes from './routes/auth';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const app = express();
const PORT = 3000;

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
  cookie: { 
    secure: false, 
    maxAge: 10 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use('/api/auth', authRoutes);

import catalogRoutes from './routes/route_catalog';
import cartRoutes from './routes/route_cart';
import deliveryRoutes from './routes/route_delivery';

app.use('/api/catalog', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/delivery', deliveryRoutes);

app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен по адресу http://localhost:${PORT}`);
});