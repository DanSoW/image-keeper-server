import dotenv from 'dotenv';
dotenv.config({ path: `.${process.env.NODE_ENV}.env` });
import config from 'config';
import db from '../db/index.js';
import ApiError from '../exceptions/api-error.js';
import md5 from 'md5';
import fs from 'fs';
import sequelize from 'sequelize';

/* Сервис авторизации пользователей */
class UserService {
    /**
     * Загрузка контента на сайт
     * @param {*} data Данные для загрузки контента на сайт
     * @returns 
     */
    async upload(req) {
        let t = null;

        try {
            const { name, currentChunkIndex, totalChunks, label } = req.query;
            const firstChunk = parseInt(currentChunkIndex) === 0;
            const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
            const ext = name.split('.').pop();
            const data = req.body.toString().split(',')[1];
            const buffer = new Buffer(data, 'base64');

            const tmpFilename = 'tmp_' + md5(name + req.ip) + '.' + ext;
            if (firstChunk && fs.existsSync('./public/' + tmpFilename)) {
                fs.unlinkSync('./public/' + tmpFilename);
            }
            fs.appendFileSync('./public/' + tmpFilename, buffer);

            if (lastChunk) {
                const finalFilename = md5(Date.now()).substr(0, 6) + '.' + ext;
                fs.renameSync('./public/' + tmpFilename, './public/' + finalFilename);

                const t = await db.sequelize.transaction();
                const createUpload = await db.Uploads.create({
                    filename: finalFilename,
                    filepath: `${config.get('url.api')}/public/${finalFilename}`,
                    label: label
                }, { transaction: t });

                t.commit();

                return {
                    filename: finalFilename,
                    filepath: createUpload.filepath
                };
            }

            return {
                status: true
            };
        } catch (e) {
            if (t) {
                await t.rollback();
            }

            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Получение всех изображений с сортировкой по категориям
     * @param {*} req 
     * @returns 
     */
    async getImages(req) {
        try {
            const images = await db.Uploads.findAll({
                order: [
                    ["updated_at", "DESC"]
                ]
            });

            if (images.length === 0) {
                return [];
            }

            // Вычисляем верхнюю и нижнюю границу выборки
            const first = images[0].updated_at;
            const last = images[images.length - 1].updated_at;

            const result = [];

            do {
                let localResult = await db.Uploads.findAll({
                    where: sequelize.where(
                        sequelize.literal(`CAST(updated_at AS DATE)`),
                        { [sequelize.Op.eq]: first.toISOString().slice(0, 10) }
                    )
                });

                localResult = localResult.sort((a, b) => {
                    if (a.updated_at === b.updated_at) {
                        return 0;
                    } else if (a.updated_at < b.updated_at) {
                        return 1;
                    }

                    return -1;
                });

                if (localResult.length > 0) {
                    result.push({
                        date: first.toISOString().slice(0, 10),
                        images: localResult
                    });
                }
                first.setDate(first.getDate() - 1);
            } while ((first >= last) && (images.length >= 2));

            return {
                result: result,
                count_images: images.length
            };

        } catch (e) {
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Загрузка изображения
     * @param {*} req 
     * @returns 
     */
    async download(req) {
        const { id } = req;

        const upload = await db.Uploads.findOne({
            where: {
                id: id
            }
        });

        if (!upload) {
            throw ApiError.NotFound(`Ошибка: фото с идентификатором ${id} не найдено`);
        }

        return upload;
    }

    /**
     * Удаление изображения
     * @param {*} req 
     */
    async deleteImage(req) {
        const t = await db.sequelize.transaction();
        try {
            const { id } = req;
            const upload = await db.Uploads.findOne({
                where: {
                    id: id
                }
            });

            if (!upload) {
                throw ApiError.BadRequest(`Ошибка: изображения с идентификатором ${id} не найдено`);
            }

            await upload.destroy({ transaction: t });

            fs.unlinkSync(`.${upload.filepath.slice(config.get("url.api").length)}`);

            t.commit();
        } catch (e) {
            t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }

    /**
     * Изменение label'a
     * @param {*} req 
     */
    async edit(req) {
        const t = await db.sequelize.transaction();
        try {
            const { id, label } = req;
            const upload = await db.Uploads.findOne({
                where: {
                    id: id
                }
            });

            if (!upload) {
                throw ApiError.BadRequest(`Ошибка: изображения с идентификатором ${id} не найдено`);
            }

            upload.label = label;
            await upload.save({ transaction: t });

            t.commit();
        } catch (e) {
            t.rollback();
            throw ApiError.BadRequest(e.message);
        }
    }
}

export default new UserService();