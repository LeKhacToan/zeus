const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";
const VALUES_PATH = "values.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), listMajors);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Write spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {

  let values = null;
  fs.readFile(VALUES_PATH, (err, data) => {
    if (err) {
      console.log("Need create values.json file and set values");
    } else {
      values = JSON.parse(data);
      const { sheet, column, row, spreadsheet_id: spreadsheetId } = values;
      const range = `${sheet}!${colName(column)}${row}`;
      const temperature = 36 + Math.floor(Math.random() * 10)/10;  

      const request = {
        auth,
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        resource: {
          majorDimension: "COLUMNS",
          values: [[temperature, "x", "x", "x", "x", "x", "x", "x", "x", "x", "x", "x"]],
        },
      };
    
      const sheets = google.sheets({ version: "v4", auth });

      sheets.spreadsheets.values.update(request, (err, response) => {
        if (err) {
          console.log("The API returned an error: " + err);
          return;
        } else {
          console.log(`Updated: ${new Date()}`);
          updateValuesFile(values)
        }
      });
    }
  });
}

function colName(number) {
  const ordA = "A".charCodeAt(0);
  const ordZ = "Z".charCodeAt(0);
  const len = ordZ - ordA + 1;

  let name = "";
  while (number >= 0) {
    name = String.fromCharCode((number % len) + ordA) + name;
    number = Math.floor(number / len) - 1;
  }
  return name;
};

function updateValuesFile(values) {
  const {column} = values
  values = {...values, column: column + 1}
  fs.writeFile(VALUES_PATH, JSON.stringify(values), (err) => {
    if (err) return console.error(err);
  });
}
