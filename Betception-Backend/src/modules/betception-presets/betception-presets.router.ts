import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  activateOwnBetceptionPreset,
  deleteOwnBetceptionPreset,
  getOwnBetceptionPreset,
  upsertOwnBetceptionPreset,
} from './betception-presets.controller.js';
import { UpsertBetceptionPresetSchema } from './betception-presets.schema.js';

export const betceptionPresetsRouter = Router();

betceptionPresetsRouter.use(authGuard);
betceptionPresetsRouter.get('/', getOwnBetceptionPreset);
betceptionPresetsRouter.put('/', validateRequest(UpsertBetceptionPresetSchema), upsertOwnBetceptionPreset);
betceptionPresetsRouter.post('/:presetId/activate', activateOwnBetceptionPreset);
betceptionPresetsRouter.delete('/:presetId', deleteOwnBetceptionPreset);
betceptionPresetsRouter.delete('/', deleteOwnBetceptionPreset);
