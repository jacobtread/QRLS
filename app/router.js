const sheets = require('./sheets')

module.exports = (app, database) => {

    // Handle GET requests to /
    app.get('/', (req, res) => {
        // Render the index page
        res.render('index', {title: 'Home'});
    });

    // Handle GET requests to /members
    app.get('/members', (req, res) => {
        // Fetch the members from google sheets
        sheets.getNameList().then(members => {
            // Response with a success and the members
            res.json({
                status: "success",
                members: members
            });
        }).catch(err => {
            // Response with a failure
            res.json({
                "status": "failed"
            })
        });
    });

    // Handle GET requests to /attending
    app.get('/attending', (req, res) => {
        // Fetch the attending names
        database.getAttending().then(data => {
            // Render the attending page with the attendance data
            res.render('attending', {
                title: 'Attendance',
                data: data
            });
        }).catch(() => {
            // Render the attending page with an empty array of data
            // because we couldn't retrieve the data
            res.render('attending', {
                title: 'Attendance',
                data: []
            });
        });
    });

    // Handle POST requests to /attendance
    app.post('/attendance', (req, res) => {
        const body = req.body; // Get the request body
        // Make sure the body has the required data
        if (body.hasOwnProperty("name") && body.hasOwnProperty("member")) {
            const name = body.name; // The name provided
            const member = body.member === 'true'; // The member state
            // Check whether or not the name is attending
            database.isAttending(name).then(attending => {
                if (!attending) { // Make sure the person isn't already attending
                    // Add the attendance to the database
                    database.addAttendance(name, member)
                        .then(() => res.json({status: 'success'}))
                        .catch(() => res.json({status: 'failed'}))
                } else {
                    // The user is already marked so let the user know
                    // and fail the request
                    res.json({
                        status: 'failed',
                        reason: 'Already marked as attending'
                    })
                }
            }).catch(() => res.json({status: 'failed'}));
        } else { // Send a failed response because we were missing data
            res.json({status: 'failed'});
        }
    });

    // Handle DELETE request to /attendance
    app.delete('/attendance', (req, res) => {
        const body = req.body; // Get the request body
        // Make sure the body has the required data
        if (body.hasOwnProperty("name")) {
            const name = body.name; // The name provided
            // Remove the attendance
            database.removeAttendance(name)
                .then(() => res.json({status: 'success'}))
                .catch(() => res.json({status: 'failed'}))
        } else { // Send a failed response because we were missing data
            res.json({status: 'failed'})
        }
    });

    // Handle GET request to /clear-cache
    app.get('/clear-cache', (req, res) => {
        // Clear the google sheets cache
        sheets.clearCache();
        // Send a success response no matter what
        res.json({status: 'success'});
    });

    // Redirect any unknown urls to the home page
    app.use((req, res) => {
        res.redirect('/'); // Redirect
    });

}