/* Импорты */
import dotenv from 'dotenv';
dotenv.config({ path: `.${process.env.NODE_ENV}.env` });
import express from "express";
import config from "config";
import logger from "./logger/logger.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import webApiConfig from "./config/web.api.json" assert { type: "json" };
import "./utils/array.js";
import UserRouter from './routers/user-routers.js';
import { UserRouteBase } from './constants/routes/user.js';
import errorMiddleware from './middlewares/error-middleware.js';
import db from "./db/index.js";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import ExpressSwaggerGenerator from 'express-swagger-generator';
import swiggerOptions from './config/swagger.options.js';
import bodyParser from "body-parser";
import md5 from 'md5';
import fs from 'fs';

// Получение названия текущей директории
const __dirname = dirname(fileURLToPath(import.meta.url));
// Загрузка Swagger документации из каталога docs
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'docs.yaml'));

// Инициализация экземпляра express-приложения
const app = express();

// Если разрешена демонстрация устаревшей версии Swagger
if (config.get("doc.swagger2") === true) {
    // то демонстрируем документацию помимо OpenAPI 3 версию документации Open API 2
    const expressSwaggerGenerator = ExpressSwaggerGenerator(express());
    expressSwaggerGenerator(swiggerOptions(__dirname));
}

// Добавление возможности потоковой загрузки данных
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '100mb' }));
// Добавление в промежуточкое ПО раздачу статики из директории public
app.use('/public', express.static('public'));
// Добавление обработки запросов с JSON
app.use(express.json({ extended: true }));
// Добавление вывода документации сервиса
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Настройка CORS-политик
app.use(cors({
    credentials: true,
    origin: webApiConfig['web_api'].map((value) => {
        return value;
    })
}));
// Связывание глобальных маршрутов с роутерами
app.use(UserRouteBase, UserRouter);

// Добавление промежуточного ПО для обработки ошибок
app.use(errorMiddleware);

const PORT = config.get('port') || 5000;

/**
 * Запуск express-приложения (начало прослушивания по определённому порту)
 * @returns
 */
const start = () => {
    try {
        // Начало прослушивания конкретного порта
        const server = app.listen(PORT, () => console.log(`Сервер запущен с портом ${PORT}`));
        logger.info({
            port: PORT,
            message: "Запуск сервера"
        });

        // Возвращение экземпляра
        return server;
    } catch (e) {
        logger.error({
            message: e.message
        });

        process.exit(1);
    }
}

start();