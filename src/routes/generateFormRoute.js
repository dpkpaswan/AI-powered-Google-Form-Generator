import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middlewares/validate.js';
import { generateFormLimiter } from '../middlewares/rateLimit.js';
import { requireUser } from '../middlewares/requireUser.js';
import { generateFormController } from '../controllers/generateFormController.js';
import { extractFromImagesController } from '../controllers/extractFromImagesController.js';
import multer from 'multer';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 6 * 1024 * 1024
  }
});

const toLower = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

const GenerateFormSchema = z.object({
  prompt: z.string().min(5).max(5000),
  formType: z.preprocess(toLower, z.enum(['survey', 'quiz', 'feedback', 'registration'])),
  audience: z.preprocess(toLower, z.enum(['students', 'staff', 'public'])),
  language: z.preprocess(toLower, z.enum(['english', 'tamil', 'hindi'])),
  tone: z.preprocess(toLower, z.enum(['formal', 'academic', 'casual']))
});

router.post(
  '/generate-form',
  requireUser,
  generateFormLimiter,
  validateBody(GenerateFormSchema),
  generateFormController
);

router.post(
  '/extract-from-images',
  requireUser,
  generateFormLimiter,
  upload.array('images', 5),
  extractFromImagesController
);

export default router;
