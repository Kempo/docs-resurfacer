import { google } from 'googleapis';
import { S3 } from 'aws-sdk';
import credentials from './credentials.json';

const bucket = new S3();

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

// save newly generated token file in S3
// const TOKEN_PATH = 'token.json';

export async function onLoad() {
  // Load client secrets from a local file.
  // Authorize a client with credentials, then call the Google Docs API.
  return authorize(credentials);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if there is already existing refresh/access tokens
  // Check from S3

  bucket.getObject({
    Bucket: 'docs-resurfacer-access-tokens',
    Key: 'aaron-chen.json'
  }).promise().then((data) => {
    console.log('retrieved');
    console.log(data);

    // set OAuth

  }).catch(err => {
    console.log('No file detected.');
    const res = getNewToken(oAuth2Client);
    console.log(res);
  });

  return 'Finished.';
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  // return authUrl to client
  // client sends back request with code
  return `Please visit ${authUrl}`;
}

export async function processToken(callback, code) {
  console.log(credentials);

  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  return oAuth2Client.getToken(code, (err, token) => {
    if (err) { return err };
    oAuth2Client.setCredentials(token);

    bucket.upload({
      Bucket: 'docs-resurfacer-access-tokens',
      Key: 'aaron-chen.json',
      Body: JSON.stringify(token)
    }).promise().then(res => {
      console.log('success uploaded.');
      console.log(res);
    }).catch(err => {
      console.log(err);
    })

    callback(oAuth2Client);
  });
}