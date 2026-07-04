import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';

const router = Router();

// Type-ahead suggestions (stories + people) for the navbar search box.
router.get('/suggest', searchController.suggest);

export default router;
