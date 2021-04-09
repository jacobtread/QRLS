const sheets = require('./sheets')

module.exports = (app, database) => {

    app.get('/', function (req, res, next) {
        res.render('index', {title: 'Home'});
    });

    app.get('/members', function (req, res, next) {
        sheets.fetchMembers().then(members => {
            res.json({
                status: "success",
                members: members
            });
        }).catch(err => {
            res.json({
                "status": "failed"
            })
        })
    });

    app.get('/attending', function (req, res, next) {
        database.getAttending().then(data => {
            res.render('attending', {
                title: 'Attendance', data: data
            });
        }).catch(() => {
            res.render('attending', {
                title: 'Attendance', data: []
            });
        })

    });

    app.post('/attendance', function (req, res) {
        const body = req.body;
        if (body.hasOwnProperty("name") && body.hasOwnProperty("member")) {
            const name = body.name;
            const member = body.member === 'true';
            database.isAttending(name).then(attending => {
                if (!attending) {
                    database.addAttendance(name, member)
                        .then(() => res.json({status: 'success'}))
                        .catch(() => res.json({status: 'failed'}))
                } else {
                    res.json({status: 'failed', reason: 'Already marked as attending'})
                }
            }).catch(() => res.json({status: 'failed'}))
        } else {
            res.json({status: 'failed'})
        }
    });

    app.delete('/attendance', function (req, res) {
        const body = req.body;
        if (body.hasOwnProperty("name")) {
            const name = body.name;
            database.removeAttendance(name)
                .then(() => res.json({status: 'success'}))
                .catch(() => res.json({status: 'failed'}))
        } else {
            res.json({status: 'failed'})
        }
    })

    app.use(function (req, res, next) {
        res.redirect('/')
    });

}