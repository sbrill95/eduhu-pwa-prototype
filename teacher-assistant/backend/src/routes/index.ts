import { Router } from 'express';
import healthRouter from './health';
import chatRouter from './chat';

const router = Router();

// Mount health routes
router.use('/', healthRouter);

// Mount chat routes
router.use('/', chatRouter);

// TODO: Add more routes here as the application grows
// router.use('/auth', authRouter);
// router.use('/users', userRouter);
// router.use('/courses', courseRouter);

export default router;
