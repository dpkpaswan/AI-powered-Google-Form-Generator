import { extractPromptFromImages } from '../services/geminiService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const extractFromImagesController = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!Array.isArray(files) || files.length < 1) {
    return res.status(400).json({ error: { code: 'NO_IMAGES', message: 'Please upload at least one image.' } });
  }

  const result = await extractPromptFromImages({ files });

  return res.json({
    extractedPrompt: result?.extractedPrompt,
    imagesProcessed: files.length
  });
});
