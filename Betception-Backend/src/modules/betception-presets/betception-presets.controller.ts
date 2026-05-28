import { Request, Response } from 'express';
import { AppDataSource } from '../../db/data-source.js';
import { BetceptionPreset } from '../../entity/BetceptionPreset.js';
import { User } from '../../entity/User.js';
import type { UpsertBetceptionPresetInput } from './betception-presets.schema.js';

const MAX_PRESETS_PER_USER = 9;

function serializePreset(preset: BetceptionPreset | null) {
  if (!preset) return null;
  return {
    id: preset.id,
    name: preset.name,
    stakeMode: preset.stakeMode,
    items: preset.configJson?.items ?? [],
    isActive: preset.isActive,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
  };
}

function serializePresetResponse(presets: BetceptionPreset[]) {
  const activePreset = presets.find((preset) => preset.isActive) ?? presets[0] ?? null;
  return {
    preset: serializePreset(activePreset),
    presets: presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      stakeMode: preset.stakeMode,
      items: preset.configJson?.items ?? [],
      isActive: preset.isActive,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
    })),
    activePresetId: activePreset?.id ?? null,
  };
}

async function getUserPresets(userId: string) {
  return AppDataSource.getRepository(BetceptionPreset).find({
    where: { user: { id: userId } },
    order: { isActive: 'DESC', updatedAt: 'DESC', id: 'DESC' },
  });
}

export async function getOwnBetceptionPreset(req: Request, res: Response) {
  const userId = String(req.user?.sub);
  const presets = await getUserPresets(userId);

  return res.json(serializePresetResponse(presets));
}

export async function upsertOwnBetceptionPreset(
  req: Request<unknown, unknown, UpsertBetceptionPresetInput>,
  res: Response,
) {
  const userId = String(req.user?.sub);
  const userRepo = AppDataSource.getRepository(User);
  const presetRepo = AppDataSource.getRepository(BetceptionPreset);
  const user = await userRepo.findOne({ where: { id: userId }, select: ['id'] });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const existingPresets = await presetRepo.find({
    where: { user: { id: userId } },
    order: { isActive: 'DESC', updatedAt: 'DESC', id: 'DESC' },
  });
  const existing = req.body.id
    ? existingPresets.find((preset) => preset.id === req.body.id)
    : null;

  if (req.body.id && !existing) {
    return res.status(404).json({ message: 'Preset not found' });
  }

  if (!existing && existingPresets.length >= MAX_PRESETS_PER_USER) {
    return res.status(400).json({ message: 'Preset limit reached' });
  }

  const shouldActivate = req.body.activate ?? !existingPresets.some((preset) => preset.isActive);
  const preset = existing ?? presetRepo.create({ user });

  preset.name = req.body.name;
  preset.stakeMode = req.body.stakeMode;
  preset.configJson = { items: req.body.items };
  preset.isActive = shouldActivate || preset.isActive;

  const saved = await presetRepo.save(preset);
  if (saved.isActive) {
    await presetRepo
      .createQueryBuilder()
      .update(BetceptionPreset)
      .set({ isActive: false })
      .where('user_id = :userId', { userId })
      .andWhere('id <> :presetId', { presetId: saved.id })
      .execute();
  }

  const presets = await getUserPresets(userId);
  return res.json(serializePresetResponse(presets));
}

export async function activateOwnBetceptionPreset(req: Request<{ presetId: string }>, res: Response) {
  const userId = String(req.user?.sub);
  const presetRepo = AppDataSource.getRepository(BetceptionPreset);
  const preset = await presetRepo.findOne({
    where: { id: req.params.presetId, user: { id: userId } },
  });

  if (!preset) {
    return res.status(404).json({ message: 'Preset not found' });
  }

  await presetRepo
    .createQueryBuilder()
    .update(BetceptionPreset)
    .set({ isActive: false })
    .where('user_id = :userId', { userId })
    .execute();
  preset.isActive = true;
  await presetRepo.save(preset);

  const presets = await getUserPresets(userId);
  return res.json(serializePresetResponse(presets));
}

export async function deleteOwnBetceptionPreset(req: Request<{ presetId?: string }>, res: Response) {
  const userId = String(req.user?.sub);
  const presetRepo = AppDataSource.getRepository(BetceptionPreset);
  const presets = await getUserPresets(userId);
  const target = req.params.presetId
    ? presets.find((preset) => preset.id === req.params.presetId)
    : presets.find((preset) => preset.isActive) ?? presets[0] ?? null;

  if (!target) {
    return res.json({ success: true, ...serializePresetResponse([]) });
  }

  await presetRepo.delete({ id: target.id, user: { id: userId } });
  const remaining = await getUserPresets(userId);
  if (target.isActive && remaining.length > 0 && !remaining.some((preset) => preset.isActive)) {
    remaining[0].isActive = true;
    await presetRepo.save(remaining[0]);
  }

  return res.json({ success: true, ...serializePresetResponse(await getUserPresets(userId)) });
}
