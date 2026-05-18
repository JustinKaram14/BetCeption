import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  changeOwnPassword,
  deleteOwnAccount,
  getCurrentUser,
  getOwnProfile,
  getUserById,
  updateOwnProfile,
} from './user.controller.js';
import {
  ChangeOwnPasswordSchema,
  DeleteOwnAccountSchema,
  UpdateOwnProfileSchema,
  UserIdParamsSchema,
} from './user.schema.js';

export const userRouter = Router();

userRouter.use(authGuard);
userRouter.get('/me', getCurrentUser);
userRouter.get('/me/profile', getOwnProfile);
userRouter.patch('/me/profile', validateRequest(UpdateOwnProfileSchema), updateOwnProfile);
userRouter.patch('/me/password', validateRequest(ChangeOwnPasswordSchema), changeOwnPassword);
userRouter.delete('/me', validateRequest(DeleteOwnAccountSchema), deleteOwnAccount);
userRouter.get('/:id', validateRequest(UserIdParamsSchema, 'params'), getUserById);
