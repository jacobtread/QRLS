const {google} = require('googleapis');
const readline = require('readline');
const moment = require('moment');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']; // We only need the readonly scope because we aren't doing any writing
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS || 'data/gsheet.json'; // The path to the google credentials file
const TOKEN_PATH = process.env.TOKEN_PATH || 'data/token.json'; // The path to the google oauth token path

const authorize = () => new Promise((resolve, reject) => {
    fs.readFile(CREDENTIALS_PATH, (err, data) => {
        if (err != null) { // If we fail to read the file we must reject
            console.error('Failed to read credentials: ' + err); // Print the file error to the console for later
            reject(err); // Reject the promise
        } else {
            // Parse the contents of the JSON file
            data = JSON.parse(data.toString("utf-8"));
            // Get the data we need from the json
            const {client_secret, client_id, redirect_uris} = data.installed;
            // Create a Google OAuth client
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            // Read the token file
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) { // If we failed to read the file or it doesnt exist
                    // Create a new token and return resolve with the oauth client
                    createToken(oAuth2Client).then(resolve).catch(reject);
                } else {
                    // Set the OAuth credentials to the file contents
                    oAuth2Client.setCredentials(JSON.parse(token.toString("utf-8")));
                    // Resolve with the OAuth client
                    resolve(oAuth2Client);
                }
            });
        }
    })
});

const createToken = oAuth2Client => new Promise((resolve, reject) => {
    // Create a Google OAuth url
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    // Print a helpful little message
    console.log('Authorize this app by visiting this url:');
    // Print the auth url
    console.log(authUrl);
    // Create a readline interface so we can read user input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    // Prompt the user with a question
    rl.question('Enter the code from that page here: ', code => {
        // Close the input interface
        rl.close();
        // Get the token using the code provided via user input
        oAuth2Client.getToken(code, (err, token) => {
            if (err !== null) { // If we fail to get the token
                // Let the user know
                console.error('Error while trying to retrieve access token' + err)
            } else {
                oAuth2Client.setCredentials(token); // Set the OAuth credentials
                const tokenJson = JSON.stringify(token); // Stringify the token to JSON
                // Write the token to the TOKEN_PATH
                fs.writeFile(TOKEN_PATH, tokenJson, err => {
                    if (err) { // If we fail to write the token file
                        // Warn the user
                        console.error('Failed to save the token printing it instead');
                        console.log(tokenJson); // Print out the token so they can save it
                        reject(); // Reject the promise
                    } else {
                        console.log('Token stored to', TOKEN_PATH); // Let the user know we saved it
                    }
                });
                resolve(oAuth2Client); // Resolve with the OAuth client
            }
        });
    });
});

const loadFromCache = (file) => {
    const exists = fs.existsSync(file);
    // Make sure the file exists
    if (exists) {
        // Read the file contents
        const contents = fs.readFileSync(file);
        if (contents !== null) { // Make sure the contents aren't null
            // Parse the JSON contents
            return JSON.parse(contents.toString());
        }
    }
    // Give a default responses if we fail
    return {data: [], date: null};
}

// Write the data to the cache file with a date
const saveToCache = (file, data) => {
    fs.writeFile(file, JSON.stringify({date: moment(), data: data}), err => {
        if (err !== null) console.error('Failed to save cache file: ' + file) // Let the user know it failed to save
        else console.log('Saved cache file: ' + file) // Let the user know the cache has been saved
    })
}

const getFromSheet = (spreadsheetId, rangeName) => new Promise((resolve, reject) => {
    // Authorize via OAuth with google
    authorize().then(auth => {
        // noinspection JSValidateTypes IDE yells at me because of the way the google apis work
        const sheets = google.sheets({version: 'v4', auth});
        // Retrieve the google sheet
        sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: rangeName,
        }, (err, res) => {
            if (err) reject(); // Reject if we fail to get it (defaults to cache)
            const rows = res.data.values; // Get the result rows
            if (rows.length) { // Make sure we have rows
                const data = []; // The collected data from the rows
                // Loop the rows
                rows.forEach(row => {
                    if (row.length > 0) { // Make sure this row actually has data
                        data.push(row[0]) // Push the row to the data
                    }
                });
                // Save the data to its cache
                resolve(data); // Resolve the promise with the data
            }
        });
    });
});

const getCache = file => {
    // Load the cache file for the sheet
    const cache = loadFromCache(file);
    // If the cache date isn't null
    if (cache.date !== null) {
        // Add an hour to the date (because we expire the cache every hour)
        const expireDate = moment(cache.date).add(1, 'hour');
        // Make sure the current moment is before the expiry
        if (moment().isBefore(expireDate)) {
            // Return the data and use as true
            return {data: cache.data, use: true};
        }
    }
    // Return the data and use as false
    return {data: cache.data, use: false};
};

const fetchYouthSheet = () => new Promise(resolve => {
    const {data, use} = getCache(process.env.YOUTH_CACHE_FILE); // Get the cache data
    if (use) { // If we are using the cache
        resolve(data); // Resolve with the cache data
    } else {
        // Get the youth sheet
        getFromSheet(
            process.env.YOUTH_SHEET_ID,
            process.env.YOUTH_RANGE_NAME,
        ).then(result => {
            // Save the data to the cache
            saveToCache(process.env.YOUTH_CACHE_FILE, result);
            resolve(result); // Resolve the data
        }).catch(() => resolve(data));
    }
});

const fetchFacilitatorsSheet = () => new Promise(resolve => {
    const {data, use} = getCache(process.env.FACILITATORS_CACHE_FILE); // Get the cache data
    if (use) { // If we are using the cache
        resolve(data); // Resolve with the cache data
    } else {
        // Get the youth sheet
        getFromSheet(
            process.env.FACILITATORS_SHEET_ID,
            process.env.FACILITATORS_RANGE_NAME,
        ).then(result => {
            // Save the data to the cache
            saveToCache(process.env.FACILITATORS_CACHE_FILE, result);
            resolve(result); // Resolve the data
        }).catch(() => resolve(data));
    }
});

const getNameList = () => new Promise(resolve => {
    // Await all the promises for fetching sheets
    Promise.all([fetchYouthSheet(), fetchFacilitatorsSheet()]).then(values => {
        let responses = []; // The final data
        values.forEach(value => {
            responses = responses.concat(value); // Combine all the responses
        });
        resolve(responses); // Resolve the responses
    })
});


module.exports.getNameList = getNameList