import { Router } from 'express';
import {
  register, login, refresh, logout,
  verifyEmail, resendVerification,
  requestPasswordChange, confirmPasswordChange,
  forgotPassword, resetPassword,
} from './auth.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, ConfirmPasswordChangeSchema } from './auth.schema.js';
import { loginRateLimiter, refreshRateLimiter, passwordChangeLimiter } from '../../middlewares/rateLimiters.js';
import { authGuard } from '../../middlewares/authGuard.js';

export const authRouter = Router();

authRouter.post('/register', validateRequest(RegisterSchema), register);
authRouter.post('/login', loginRateLimiter, validateRequest(LoginSchema), login);
authRouter.post('/refresh', refreshRateLimiter, refresh);
authRouter.post('/logout', logout);
authRouter.get('/verify-email', verifyEmail);
authRouter.post('/resend-verification', loginRateLimiter, resendVerification);
authRouter.post('/request-password-change', authGuard, passwordChangeLimiter, requestPasswordChange);
authRouter.post('/confirm-password-change', loginRateLimiter, validateRequest(ConfirmPasswordChangeSchema), confirmPasswordChange);
authRouter.post('/forgot-password', loginRateLimiter, validateRequest(ForgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', loginRateLimiter, validateRequest(ResetPasswordSchema), resetPassword);
