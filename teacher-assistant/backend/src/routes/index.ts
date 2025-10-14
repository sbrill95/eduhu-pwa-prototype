import { Router } from 'express';
import healthRouter from './health';
import chatRouter from './chat';
import chatTagsRouter from './chatTags';
import imageGenerationRouter from './imageGeneration';
import chatSummaryRouter from './chat-summary';
import profileRouter from './profile';
import filesRouter from './files';
import storageProxyRouter from './storageProxy';
import visionTaggingRouter from './visionTagging';
// import langGraphAgentsRouter from './langGraphAgents'; // TODO: Fix TypeScript errors (ApiResponse type issues)
// import promptsRouter from './prompts'; // Disabled - prompts.ts.disabled
// import teacherProfileRouter from './teacher-profile'; // TODO: Fix TypeScript errors

const router = Router();

// Mount health routes
router.use('/', healthRouter);

// Mount chat routes
router.use('/', chatRouter);

// Mount chat tags routes
router.use('/chat', chatTagsRouter);

// Mount LangGraph image generation routes (includes timeout fix)
router.use('/langgraph', imageGenerationRouter);

// Mount chat summary routes
router.use('/chat', chatSummaryRouter);

// Mount profile routes
router.use('/profile', profileRouter);

// Mount file upload routes
router.use('/files', filesRouter);

// Mount storage proxy routes
router.use('/', storageProxyRouter);

// Mount vision tagging routes (for automatic image tagging)
router.use('/vision', visionTaggingRouter);

// Mount prompts routes
// router.use('/prompts', promptsRouter); // Disabled - prompts.ts.disabled

// TODO: Enable these routes after fixing TypeScript errors
// router.use('/teacher-profile', teacherProfileRouter);

export default router;
