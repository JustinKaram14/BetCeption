import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { getCurrentUser, getUserById } from './user.controller.js';
import { UserIdParamsSchema } from './user.schema.js';

export const userRouter = Router();

userRouter.use(authGuard);
userRouter.get('/me', getCurrentUser);
userRouter.get('/:id', validateRequest(UserIdParamsSchema, 'params'), getUserById);
