import { Router } from 'express';
import { listCrates, openCrate } from './crates.controller.js';
import { authGuard } from '../../middlewares/authGuard.js';

const cratesRouter = Router();

cratesRouter.use(authGuard);

cratesRouter.get('/', listCrates);
cratesRouter.post('/:crateId/open', openCrate);

export { cratesRouter };
