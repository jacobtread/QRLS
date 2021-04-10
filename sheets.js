const {google} = require('googleapis');
const readline = require('readline')
const fs = require('fs')

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const CRED_PATH = process.env.GOOGLE_CREDENTIALS || 'data/gsheet.json'
const TOKEN_PATH = process.env.TOKEN_PATH || 'data/token.json'

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

const loadFromCache = (file) => {
    const exists = fs.existsSync(file);
    console.log('Loading cache ' + file)
    if (exists) {
        const contents = fs.readFileSync(file);
        if (contents !== null) {
            return JSON.parse(contents.toString());
        }
    }
    return {data: [], date: null};
}


const moment = require('moment')

const saveToCache = (file, data) => {
    fs.writeFileSync(file, JSON.stringify({date: moment(), data: data}))
}

const fetchYouthSheet = () => new Promise(resolve => {
    const cacheFile = process.env.YOUTH_CACHE_FILE
    const cache = loadFromCache(cacheFile);
    if (cache.date !== null) {
        const date = moment(cache.date);
        const expireDate = date.add(1, 'hour');
        const now = moment();
        if (expireDate.isBefore(now)) {
            resolve(cache.date);
            return;
        }
    }
    authorize().then(auth => {
        const sheets = google.sheets({version: 'v4', auth});
        sheets.spreadsheets.values.get({
            spreadsheetId: process.env.YOUTH_SHEET_ID,
            range: process.env.YOUTH_RANGE_NAME,
        }, (err, res) => {
            if (err) resolve(cache.data)
            const rows = res.data.values;
            if (rows.length) {
                const youthNames = []
                rows.forEach(row => {
                    youthNames.push(row[0])
                });
                saveToCache(cacheFile, youthNames);
                resolve(youthNames);
            }
        });
    }).catch(() => resolve(cache.data));
});

const fetchFacilitatorsSheet = () => new Promise(resolve => {
    const cacheFile = process.env.FACILITATORS_CACHE_FILE
    const cache = loadFromCache(cacheFile)
    if (cache.date !== null) {
        const date = moment(cache.date);
        const expireDate = date.add(1, 'hour');
        const now = moment();
        if (expireDate.isBefore(now)) {
            resolve(cache.date);
            return;
        }
    }
    authorize().then(auth => {
        const sheets = google.sheets({version: 'v4', auth});
        sheets.spreadsheets.values.get({
            spreadsheetId: process.env.FACILITATORS_SHEET_ID,
            range: process.env.FACILITATORS_RANGE_NAME,
        }, (err, res) => {
            if (err) resolve(cache.data)
            const rows = res.data.values;
            if (rows.length) {
                const facilitatorNames = []
                rows.forEach(row => {
                    facilitatorNames.push(row[0])
                });
                saveToCache(cacheFile, facilitatorNames)
                resolve(facilitatorNames);
            }
        });
    }).catch(() => resolve(cache.data));
});

const fetchMembers = () => new Promise((resolve, reject) => {
    fetchYouthSheet().then(youth => {
        fetchFacilitatorsSheet().then(facilitators => {
            resolve(youth.concat(facilitators))
        })
    })
});


module.exports = {
    fetchMembers: fetchMembers,

}
