import { Router } from 'express';
import { login, getMe } from './auth.controller';
import { loginSchema } from './auth.schema';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
