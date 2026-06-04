import express from 'express';
import { getHomepageData } from '../controllers/homeController.js';

const router = express.Router();

router.get('/', getHomepageData);

export default router;