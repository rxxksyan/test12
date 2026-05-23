import { Router } from 'express';
import { getLocale, setLocale, getCurrentLocale } from '../controllers/controller_localization';

const router = Router();

router.get('/:lang', getLocale);
router.post('/', setLocale);
router.get('/', getCurrentLocale);

export default router;
