import express from 'express';
import {
    getContent,
    updateContent,
    addService,
    updateService,
    deleteService,
    addMenu,
    updateMenu,
    deleteMenu,
} from '../controllers/cateringController.js';
import { upload } from '../configs/multer.js';
import authSeller from '../middlewares/authSeller.js';

const cateringRouter = express.Router();

// ─── Public ───
cateringRouter.get('/content', getContent);

// ─── Admin: Content ───
cateringRouter.put('/content', authSeller, updateContent);

// ─── Admin: Services ───
cateringRouter.post('/services', authSeller, upload.single('image'), addService);
cateringRouter.put('/services/:id', authSeller, upload.single('image'), updateService);
cateringRouter.delete('/services/:id', authSeller, deleteService);

// ─── Admin: Menus ───
cateringRouter.post('/menus', authSeller, upload.single('image'), addMenu);
cateringRouter.put('/menus/:id', authSeller, upload.single('image'), updateMenu);
cateringRouter.delete('/menus/:id', authSeller, deleteMenu);

export default cateringRouter;
