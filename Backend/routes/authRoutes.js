import express from 'express';
import { githubLogin } from '../controllers/authController.js';

const router = express.Router();

router.get('/github', githubLogin);

export default router;
