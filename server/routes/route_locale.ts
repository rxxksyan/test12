import { Router } from 'express';
import { setLocale, getCurrentLocale } from '../controllers/controller_localization';

const router = Router();

router.post('/', setLocale);
router.get('/', getCurrentLocale);

export default router;
