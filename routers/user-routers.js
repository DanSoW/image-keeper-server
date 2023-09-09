import { Router } from 'express';
import { check } from 'express-validator';
import userController from '../controllers/user-controller.js';
import UserRoute from '../constants/routes/user.js';

const router = new Router();

router.post(
    UserRoute.upload,
    userController.upload
);

router.get(
    UserRoute.images,
    userController.getImages
);

router.get(
    UserRoute.download,
    userController.download
);

router.post(
    UserRoute.delete,
    userController.deleteImage
);

router.post(
    UserRoute.edit,
    userController.edit
);

export default router;