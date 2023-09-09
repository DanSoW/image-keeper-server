/*--------------------------------------------------------
  Подключение к базе данных PostgreSQL.
  Общая точка входа всех моделей.
  -------------------------------------------------------- */

/* Конфигурация */
import dotenv from 'dotenv';
dotenv.config({ path: `.${process.env.NODE_ENV}.env` });

/* Библиотеки */
import { Sequelize } from 'sequelize';
import config from 'config';

/* Модели Sequelize */
import Uploads from './models/Uploads.js';

// Глобальный объект для работы с Sequelize ORM
const db = {};

// Подключение к базе данных PostgreSQL
const sequelize = new Sequelize(
  config.get("database").database,
  config.get("database").user,
  process.env.DB_PASSWORD,
  {
    dialect: "postgres",
    host: config.get("database").host,
    port: config.get("database").port,
    define: {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    logging: false,
    pool: {
      max: 1000,
      min: 0,
      idle: 20000,
      acquire: 20000
    }
  },
);

// Добавление глобальному объекту всех моделей
db.Uploads = Uploads(sequelize, Sequelize.DataTypes);

// Установка взаимосвязей между моделями (таблицами базы данных)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Синхронизация моделей с базой данных
sequelize.sync().then(result => {
  if (config.get('log.sequelize')) {
    console.log(result);
  }
  console.log("Синхронизация с базой данных: успешно");
}).catch(err => console.log(err));

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
