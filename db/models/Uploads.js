import { genForeignKey } from "../../utils/db.js";

const Uploads = (sequelize, DataTypes) => {
    const model = sequelize.define('uploads', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        filename: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        filepath: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        label: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    });

    return model;
};

export default Uploads;