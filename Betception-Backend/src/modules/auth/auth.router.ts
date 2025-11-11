import { Router } from 'express';
import { register, login, refresh, logout } from './auth.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { RegisterSchema, LoginSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', validateRequest(RegisterSchema), register);
authRouter.post('/login', validateRequest(LoginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
