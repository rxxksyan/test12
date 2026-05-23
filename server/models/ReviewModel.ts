import fs from 'fs/promises';
import path from 'path';

const REVIEWS_FILE = path.join(__dirname, '../../reviews.json');

export interface Review {
  id: string;
  productId: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function readReviews(): Promise<Review[]> {
  try {
    const data = await fs.readFile(REVIEWS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeReviews(reviews: Review[]): Promise<void> {
  await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}
