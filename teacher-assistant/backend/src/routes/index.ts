import { Router } from 'express';
import healthRouter from './health';
import chatRouter from './chat';
import chatTagsRouter from './chatTags';
import imageGenerationRouter from './imageGeneration';
import chatSummaryRouter from './chat-summary';
import profileRouter from './profile';
import filesRouter from './files';
// import promptsRouter from './prompts'; // Disabled - prompts.ts.disabled
// TODO: Fix TypeScript errors in these routes before enabling
// import langGraphAgentsRouter from './langGraphAgents';
// import teacherProfileRouter from './teacher-profile';

const router = Router();

// Mount health routes
router.use('/', healthRouter);

// Mount chat routes
router.use('/', chatRouter);

// Mount chat tags routes
router.use('/chat', chatTagsRouter);

// Mount image generation routes (simple fallback for broken langGraphAgents)
router.use('/langgraph', imageGenerationRouter);

// Mount chat summary routes
router.use('/chat', chatSummaryRouter);

// Mount profile routes
router.use('/profile', profileRouter);

// Mount file upload routes
router.use('/files', filesRouter);

// Mount prompts routes
// router.use('/prompts', promptsRouter); // Disabled - prompts.ts.disabled

// TODO: Fix TypeScript errors in langGraphAgents before enabling
// router.use('/langgraph', langGraphAgentsRouter);

// TODO: Enable these routes after fixing TypeScript errors
// router.use('/teacher-profile', teacherProfileRouter);

export default router;
