const mysql = require('mysql2');
const moment = require('moment');

// Create a new connection with the database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

const addAttendance = (name, member) => new Promise((resolve, reject) => {
    // Quest the database inserting a new row for today with the name
    connection.query('INSERT INTO `attendance_record`(`full_name`, `registered`, `arrival_date`, `arrival_time`) VALUES (?, ?, CURRENT_DATE(), CURRENT_TIME())',
        [name, +member] /* Convert the member bool to an int */, err => {
            if (err != null) {  // If there is an error retrieving the data
                console.error('ERROR Failed to add attendance with db: ' + err)
                reject(); // Reject the promise
            } else {
                resolve(); // Resolve the promise because it was added
            }
        });
});

const getAttending = (date) => new Promise((resolve, reject) => {
    // Query the database finding all results that match today's date
<<<<<<< Updated upstream
    connection.query('SELECT `full_name`, `registered`, `arrival_time` FROM `attendance_record` WHERE arrival_date = DATE(?)',
        [date.format('YYYY-DD-MM')],
        (err, result) => {
        console.log(result)
=======
    connection.query('SELECT `full_name`, `registered`, `arrival_time` FROM `attendance_record` WHERE `arrival_date` = ?',
        [date.format('YYYY-MM-DD').toString()],
        (err, result) => {
            console.log(result, date.format('YYYY-MM-DD'));
>>>>>>> Stashed changes

            if (err != null) { // If there is an error retrieving the data
                console.error('ERROR Failed to get attendance with db: ' + err)
                reject(); // Reject the promise
            } else {
                // Resolve the promise with the mapped result
                resolve(result.map(row => { // Map each result
                    // Extract the needed data from the row
                    const {full_name, registered, arrival_time} = row;
                    // Return the mapped value
                    return {
                        name: full_name, // Set the row name
                        guest: registered === 0, // Set the guest variable to true if registered is 0
                        time: moment(arrival_time, 'hh:mm:ss').format('h:mm a')  // Use moment.js convert the 24 hour time to h:mm a
                    }
                }));
            }
        });
});

const isAttending = name => new Promise((resolve, reject) => {
    // Query the database finding any names where the current date is today
    connection.query('SELECT `attendance_id` FROM `attendance_record` WHERE `arrival_date` = CURRENT_DATE() AND full_name = ? LIMIT 1',
        [name], (err, result) => {
            if (err != null) { // If there is an error retrieving the data
                console.error('ERROR Failed to check attendance with db: ' + err)
                reject();  // Reject the promise
            } else {
                resolve(result !== null && result.length > 0); // Resolve the promise as true if there are any results
            }
        });
})

const removeAttendance = name => new Promise((resolve, reject) => {
    // Query the database connection and delete the record for this date with the matching name
    connection.query('DELETE FROM attendance_record WHERE full_name = ? AND arrival_date = CURRENT_DATE() LIMIT 1',
        [name], err => {
            if (err != null) { // If there is an error retrieving the data
                console.error('ERROR Failed to remove attendance with db: ' + err)
                reject();  // Reject the promise
            } else {
                resolve(); // Resolve the promise
            }
        }
    );
});

module.exports = {
    addAttendance,
    removeAttendance,
    getAttending,
    isAttending,
}