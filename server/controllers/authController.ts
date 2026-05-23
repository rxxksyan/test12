import { Request, Response } from 'express';
import * as UserModel from '../models/UserModel';
import bcrypt from 'bcrypt';

export async function register(req: Request, res: Response) {
  const { nickname, email, password, phone } = req.body;

  if (!nickname || !email || !password) {
    return res.status(400).json({ message: 'Необходимо заполнить все поля' });
  }

  try {
    const existingEmail = await UserModel.findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Пользователь с таким emal уже существует' });
    }

    const existingNickname = await UserModel.findUserByNickname(nickname);
    if (existingNickname) {
      return res.status(400).json({ message: 'Пользователь с таким никнеймом уже существует' });
    }

    const user = await UserModel.createUser(nickname, email, password, phone);

    req.session.userId = user.id;

    res.status(201).json({ message: 'Регистрация прошла успешно', user: { id: user.id, nickname: user.nickname, email: user.email, phone: user.phone } });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера 4' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Необходим email-почта и пароль' });
  }

  try {
    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Некорректный email или пароль' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Некорректный email или пароль' });
    }

    req.session.userId = user.id;

    res.json({ message: 'Авторизация прошла успешно', user: { id: user.id, nickname: user.nickname, email: user.email } });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера 2' });
  }
}

export async function getMe(req: Request, res: Response) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Не аутентифицирован' });
  }

  try {
    const users = await UserModel.readUsers();
    const user = users.find(u => u.id === req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    res.json({ 
      user: { 
        id: user.id, 
        nickname: user.nickname, 
        email: user.email,
        createdAt: user.createdAt
      } 
    });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера 3' });
  }
}

export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Не удалось выйти из аккаунта' });
    }
    res.json({ message: 'Выход выполнен успешно' });
  });
}

export async function changePassword(req: Request, res: Response) {
  const { oldPassword, newPassword } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Не аутентифицирован' });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Требуется старый и новый пароль.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Новый пароль должен состоять как минимум из 6 символов.' });
  }

  try {
    const users = await UserModel.readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const user = users[userIndex];
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Старый пароль неверен' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    users[userIndex].passwordHash = newPasswordHash;
    await UserModel.writeUsers(users);

    req.session.destroy((err) => {
      if (err) console.error('Ошибка разрыва сеанса:', err);
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err: unknown) {
    console.error('Ошибка смены пароля:', err);
    res.status(500).json({ message: 'Ошибка сервера 4' });
  }
}