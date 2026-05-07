import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  changeOwnPassword,
  getCurrentUser,
  getOwnProfile,
  getUserById,
  updateOwnProfile,
} from './user.controller.js';
import {
  ChangeOwnPasswordSchema,
  UpdateOwnProfileSchema,
  UserIdParamsSchema,
} from './user.schema.js';

export const userRouter = Router();

userRouter.use(authGuard);
userRouter.get('/me', getCurrentUser);
userRouter.get('/me/profile', getOwnProfile);
userRouter.patch('/me/profile', validateRequest(UpdateOwnProfileSchema), updateOwnProfile);
userRouter.patch('/me/password', validateRequest(ChangeOwnPasswordSchema), changeOwnPassword);
userRouter.get('/:id', validateRequest(UserIdParamsSchema, 'params'), getUserById);
