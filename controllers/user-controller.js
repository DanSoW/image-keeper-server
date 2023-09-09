import { validationResult } from "express-validator";
import ApiError from "../exceptions/api-error.js";
import userService from "../services/user-service.js";
import config from "config";

/**
 * Котнроллер пользовательских API
 */
class UserController {
    async upload(req, res, next) {
        try {
            const data = await userService.upload(req);

            return res.status(201).json(data);
        } catch (e) {
            console.log(e);
            next(e);
        }
    }

    async getImages(req, res, next) {
        try {
            const data = await userService.getImages(req);

            return res.status(200).json(data);
        } catch (e) {
            next(e);
        }
    }

    async download(req, res, next) {
        try {
            const data = await userService.download(req.query);

            return res.download(`.${data.filepath.slice(config.get("url.api").length)}`, data.filename);
        } catch (e) {
            next(e);
        }
    }

    async deleteImage(req, res, next){
        try {
            const data = await userService.deleteImage(req.body);

            return res.status(201).json(data);
        } catch (e) {
            next(e);
        }
    }

    async edit(req, res, next){
        try {
            const data = await userService.edit(req.body);

            return res.status(201).json(data);
        } catch (e) {
            next(e);
        }
    }
}

export default new UserController();