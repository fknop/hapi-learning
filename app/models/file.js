'use strict';

const Path = require('path');


module.exports = function (sequelize, DataTypes) {

    return sequelize.define('File', {
        name: {
            type: DataTypes.STRING,
            unique: 'file_key',
            allowNull: false,
            field: 'name',
            set: function (val) {

                this.setDataValue('name', val);
                let ext = Path.extname(val);
                if (ext.length === 0) {
                    ext = null;
                }
                this.setDataValue('ext', ext);
            }
        },
        directory: {
            type: DataTypes.STRING,
            unique: 'file_key',
            allowNull: true, // If root folder == null
            field: 'directory'
        },
        ext: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: true,
            field: 'ext'
        },
        type: {
            type: DataTypes.ENUM('f', 'd'),
            unique: false,
            allowNull: false,
            field: 'type'
        },
        hidden: {
            type: DataTypes.BOOLEAN,
            unique: false,
            allowNull: false,
            field: 'hidden'
        },
        size: {
            type: DataTypes.BIGINT,
            unique: false,
            allowNull: true,
            field: 'size'
        },
        course_code: {
            type: DataTypes.STRING,
            unique: 'file_key',
            allowNull: false,
            references: {
                model: 'courses',
                key: 'code'
            }
        }
    }, {
        tableName: 'files',
        underscored: true
    });
};
