const mysql = require('mysql2')
const moment = require('moment');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB
});

const table = process.env.DB_TABLE

function addAttendance(name, member) {
    member = member === true ? 1 : 0;
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO `attendance_record`(`full_name`, `registered`, `arrival_date`, `arrival_time`) VALUES (?, ?, CURRENT_DATE(), CURRENT_TIME())',
            [name, member], (err, result, fields) => {
                if (err !== null) {
                    reject();
                } else {
                    resolve();
                }
            });
    })
}

function getAttending() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT `full_name`, `registered`, `arrival_time` FROM `attendance_record` WHERE arrival_date = CURRENT_DATE()',
            (err, result, fields) => {
                if (err !== null) {
                    reject();
                } else {
                    resolve(result.map(row => {
                        return {
                            name: row.full_name,
                            guest: row.registered === 0,
                            time: moment(row.arrival_time, 'hh:mm:ss').format('h:mm a')
                        }
                    }));
                }
            });
    })
}

function isAttending(name) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT `attendance_id` FROM `attendance_record` WHERE `arrival_date` = CURRENT_DATE() AND full_name = ? LIMIT 1',
            [name], (err, result) => {
                if (err !== null) {
                    reject();
                } else {
                    resolve(result !== null && result.length > 0);
                }
            });
    })
}

function removeAttendance(name) {
    return new Promise((resolve, reject) => {
        connection.query(
            'DELETE FROM attendance_record WHERE full_name = ? AND arrival_date = CURRENT_DATE() LIMIT 1',
            [name], (err, result) => {
                if (err !== null) {
                    reject();
                } else {
                    resolve();
                }
            }
        );
    })
}

module.exports = {
    addAttendance,
    isAttending,
    getAttending,
    removeAttendance
}