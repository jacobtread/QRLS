require('dotenv').config({path: '../../.env'})
const readline = require('readline')
const fs = require('fs')
const mysql = require('mysql2')

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

const rl = readline.createInterface({
    input: fs.createReadStream('data/attendance_record.csv'),
    output: process.stdout,
    terminal: false
});

let totalAlive = 0;

rl.on('line', line => {
    const parts = line.split(',');
    const index = parts[0];
    const name = parts[1];
    const registered = parts[2];
    const dateTime = parts[3];
    const dateTimeParts = dateTime.split(' ');
    const date = dateTimeParts[0];
    const time = dateTimeParts[1];
    totalAlive++;
    connection.query('INSERT INTO `attendance_record`(attendance_id, full_name, registered, arrival_date, arrival_time) VALUES (?, ?, ?, ?, ?)',
        [index, name, registered, date, time], err => {
            if (err != null) console.error('Error' + err)
            totalAlive--;
        })
});

rl.on('done', () => {
    while (totalAlive > 0) {
        console.log(totalAlive)
    }
    connection.destroy()
    console.log('Done')
})