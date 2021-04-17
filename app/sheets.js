const {google} = require('googleapis');
const fs = require('fs');
const moment = require('moment');

// The access scope for our google api request
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']; // We only need the readonly scope because we aren't doing any writing

// Load and ensure that we have the required environment variables
const JWT_TOKEN_PATH = process.env.JWT_TOKEN_PATH;
if (!JWT_TOKEN_PATH) console.error('ERROR `TOKEN_PATH` IS NOT DEFINED IN ENVIRONMENT VARIABLES');
const JWT_CREDENTIALS_PATH = process.env.JWT_CREDENTIALS_PATH;
if (!JWT_CREDENTIALS_PATH) console.error('ERROR `JWT_CREDENTIALS_PATH` IS NOT DEFINED IN ENVIRONMENT VARIABLES');
const CACHE_FILE_PATH = process.env.CACHE_FILE_PATH;
if (!CACHE_FILE_PATH) console.error('ERROR `CACHE_FILE_PATH` IS NOT DEFINED IN ENVIRONMENT VARIABLES');
const CACHE_EXPIRE_TIME = parseInt(process.env.CACHE_EXPIRE_TIME) || 1

// Authorize with JWT
const authorize = () => new Promise((resolve, reject) => {
    // Load the JWT Credentials file
    fs.readFile(JWT_CREDENTIALS_PATH, (err, fileData) => {
        if (err != null) { // If we failed to read the file or it doesn't exist
            // Warn the user
            console.error(`ERROR Failed to read JWT credentials from "${JWT_CREDENTIALS_PATH}": ${err}`);
            reject(); // Reject the promise
        } else {
            // Parse the JSON in the file
            const credentials = JSON.parse(fileData.toString('utf-8'));
            // Retrieve the email and private key from the JSON
            const {client_email, private_key} = credentials;
            // Create a new JWT client with the credentials
            const jwtClient = new google.auth.JWT({
                email: client_email,
                key: private_key,
                scopes: SCOPES
            });
            // Read the JWT Token file
            fs.readFile(JWT_TOKEN_PATH, (err, tokenFileData) => {
                if (err != null) { // If we failed to read the file or it doesn't exist
                    console.debug('Authorizing with JWT'); // Debug messaging
                    // Generate new token
                    jwtClient.authorize((err, tokenData) => {
                        if (err != null) { // If we failed to authorize with JWT
                            console.error('ERROR Failed to authorize with JWT: ' + err);
                            reject(); // Reject the promise
                        } else {
                            const tokenString = JSON.stringify(tokenData)
                            // Write the JWT token to its file
                            fs.writeFile(JWT_TOKEN_PATH, tokenString, err => {
                                if (err) { // If we failed to write to the file
                                    // Warn the user
                                    console.error(`ERROR Failed to write JWT token to "${JWT_TOKEN_PATH}": ${err}`)
                                }
                            });
                            // Resolve with the JWT client
                            resolve(jwtClient);
                        }
                    });
                } else {
                    // Parse the JWT token from the JSON file
                    const tokenData = JSON.parse(tokenFileData.toString('utf-8'));
                    // Set the JWT credentials to the token
                    jwtClient.setCredentials(tokenData);
                    // Resolve with the JWT client
                    resolve(jwtClient);
                }
            });
        }
    })
});

// Retrieve the range data from a google sheet
const fetchGoogleSheet = (jwtClient, spreadsheetId, rangeName) => new Promise(resolve => {
    const sheets = google.sheets({version: 'v4', auth: jwtClient});
    sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: rangeName
    }, {}, (err, result) => {
        if (err != null) { // If we failed to retrieve the data
            // Warn the user
            console.error(`ERROR Failed to retrieve google sheet ID "${spreadsheetId} RANGE "${rangeName}": ${err}`);
            // Resolve with empty array
            resolve([]);
        } else {
            const rows = result.data.values; // Get the result rows
            if (rows.length) { // Ensure we have rows
                // Map the data to its first value so we only get
                // a single array not an array of arrays
                const data = rows.map(row => row[0]);
                // Resolve with the data array
                resolve(data);
            }
        }
    });
});

// Load the cache expiry file (this tells us when its due to expire)
const loadCacheExpiry = () => new Promise(resolve => {
    // Read the cache expiry file
    fs.readFile(CACHE_FILE_PATH + '.expiry', (err, data) => {
        if (err != null) { // If we failed to read the file or it doesn't exist
            resolve(null); // Resolve with null
        } else {
            data = data.toString('utf-8'); // Convert the loaded data to a string
            resolve(moment(data)); // Resolve with the data as moment object
        }
    });
});

// Save the provided data to the cache file
const saveCache = data => {
    data = JSON.stringify(data); // Serialize the data
    // Write the data to the cache file
    fs.writeFile(CACHE_FILE_PATH, data, err => {
        if (err != null) { // If we failed to write the cache file
            // Warn the user
            console.error('ERROR Failed to save cache file: ' + err);
        } else {
            // Calculate the expiry date
            const expiry = moment().add(CACHE_EXPIRE_TIME, 'hour')
            // Write the expiry date to the app.json.expiry file
            fs.writeFile(CACHE_FILE_PATH + '.expiry', expiry.toISOString(), err => {
                if (err != null) { // If we failed to write the cache expiry file
                    // Warn the user
                    console.error('ERROR Failed to save cache file time: ' + err)
                }
            });
        }
    });
}

const clearCache = () => {
    fs.rmSync(CACHE_FILE_PATH);
    fs.rmSync(CACHE_FILE_PATH + '.expiry');
}

// Loads the cache file data
const loadCache = () => new Promise((resolve, reject) => {
    // Read the cache file
    fs.readFile(CACHE_FILE_PATH, (err, data) => {
        if (err != null) { // If we failed to read the file or it doesn't exist
            // Warn the user
            console.error('ERROR Failed to load cache file: ' + err);
            reject(); // Reject the promise
        } else {
            // Parse the JSON data of the file
            data = JSON.parse(data.toString('utf-8'));
            resolve(data); // Resolve with the data
        }
    });
});

// Get the list of member names
const getNameList = () => new Promise(resolve => {
    loadCacheExpiry().then(cacheExpiry => {
        let isExpired;
        if (cacheExpiry == null) {
            isExpired = true;
        } else {
            const now = moment();
            // IDE doesn't know `cacheExpiry` is a moment object
            // noinspection JSCheckFunctionSignatures
            isExpired = !now.isBefore(cacheExpiry);
        }
        const fromCache = () => {
            loadCache().then(data => {
                resolve(data)
            }).catch(() => {
                console.warn('WARNING Failed to load cache defaulting to empty');
                resolve([]);
            });
        }
        if (!isExpired) {
            fromCache();
        } else {
            authorize().then(jwtClient => {
                const facilitatorsPromise = fetchGoogleSheet(
                    jwtClient,
                    process.env.FACILITATORS_SHEET_ID,
                    process.env.FACILITATORS_RANGE_NAME
                );
                const youthPromise = fetchGoogleSheet(
                    jwtClient,
                    process.env.YOUTH_SHEET_ID,
                    process.env.YOUTH_RANGE_NAME
                );
                Promise.all([facilitatorsPromise, youthPromise]).then(values => {
                    let responses = [];
                    values.forEach(value => responses = responses.concat(value));
                    if (responses.length > 0) {
                        saveCache(responses);
                    }
                    resolve(responses);
                });
            }).catch(() => {
                console.warn(`WARNING Failed to authorize with JWT defaulting to old cache from "${cacheExpiry}"`)
                fromCache();
            });
        }
    });
});

module.exports = {
    getNameList,
    clearCache
}