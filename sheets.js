const {google} = require('googleapis');
const readline = require('readline')
const fs = require('fs')

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const CRED_PATH = process.env.GOOGLE_CREDENTIALS || 'data/gsheet.json'
const TOKEN_PATH = process.env.TOKEN_PATH || 'data/token.json'

// noinspection SpellCheckingInspection
const sheetConfigs = {
    youth: {
        sheet_id: process.env.YOUTH_SHEET_ID,
        range_name: process.env.YOUTH_RANGE_NAME,
    },
    facilitators: {
        sheet_id: process.env.FACILITATORS_SHEET_ID,
        range_name: process.env.FACILITATORS_RANGE_NAME,
    }
}

const authorize = () => new Promise((resolve, reject) => {
    fs.readFile(CRED_PATH, (err, data) => {
        if (err != null) {
            reject(err)
        } else {
            data = JSON.parse(data.toString("utf-8"))
            const {client_secret, client_id, redirect_uris} = data.installed;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) {
                    newToken(oAuth2Client).then(resolve).catch(reject)
                } else {
                    oAuth2Client.setCredentials(JSON.parse(token.toString("utf-8")));
                    resolve(oAuth2Client);
                }
            });
        }
    })
});

const newToken = (oAuth2Client) => new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                reject('Error while trying to retrieve access token' + err)
            } else {
                oAuth2Client.setCredentials(token);
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        console.log('Token stored to', TOKEN_PATH);
                    }
                });
                resolve(oAuth2Client);
            }
        });
    });
});


const fetchMembers = () => new Promise((resolve, reject) => {
    authorize().then(auth => {
        const sheets = google.sheets({version: 'v4', auth});
        sheets.spreadsheets.values.get({
            spreadsheetId: sheetConfigs.youth.sheet_id,
            range: sheets.youth.range_name,
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const rows = res.data.values;
            if (rows.length) {
                console.log('Name');
                // Print columns A and E, which correspond to indices 0 and 4.
                rows.map((row) => {
                    console.log(`${row[0]}, ${row[4]}`);
                });
            } else {
                console.log('No data found.');
            }
        });
    }).catch(err => {
        console.log(err)
    })
})

module.exports = {
    fetchMembers: () => new Promise(resolve => {
        resolve([
            "Jacob",
            "Joseph",
            "Example",
            "John Doe",
            "Jimmy Neutron",
            "Nathan",
            "Mr Stonks"
        ])
    }),

}
