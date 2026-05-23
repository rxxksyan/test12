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

export async function getReviewsByProductId(productId: number): Promise<Review[]> {
  const reviews = await readReviews();
  return reviews
    .filter(r => r.productId === productId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function hasUserReviewedProduct(userId: string, productId: number): Promise<boolean> {
  const reviews = await readReviews();
  return reviews.some(r => r.userId === userId && r.productId === productId);
}

export async function addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  const reviews = await readReviews();
  const newReview: Review = {
    ...review,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  reviews.push(newReview);
  await writeReviews(reviews);
  return newReview;
}

export async function getAverageRating(productId: number): Promise<number> {
  const reviews = await getReviewsByProductId(productId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
