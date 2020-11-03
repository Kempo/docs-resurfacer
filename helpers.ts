import { google } from 'googleapis';
import { S3 } from 'aws-sdk';
import credentials from './credentials.json';

const bucket = new S3();

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly', 
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/drive.readonly'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

// save newly generated token file in S3
// const TOKEN_PATH = 'token.json';

export async function onLoad(callback) {
  // Load client secrets from a local file.
  // Authorize a client with credentials, then call the Google Docs API.
  return authorize(credentials, callback);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  /*
  await bucket.listObjectsV2({
    Bucket: 'docs-resurfacer-access-tokens',
  }).promise().then((res) => {
    console.log('List:')
    console.log(res);
  });
  */    

  // Check if there is already existing refresh/access tokens
  // Check from S3
  await bucket.getObject({
    Bucket: 'docs-resurfacer-access-tokens',
    Key: 'aaron-chen.json'
  }).promise().then((data) => {
    console.log(data.Body);
    console.log('Tokens successfully retrieved.');
    const pulledCredentials = JSON.parse(data.Body.toString());
    console.log(pulledCredentials);

    // convert file to readable
    // set OAuth with file
    oAuth2Client.setCredentials(pulledCredentials);
    callback(oAuth2Client);

  }).catch(err => {
    console.log('Getting new token...');
    console.log(err);
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

export async function processToken(code) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  return oAuth2Client.getToken(code, async (err, token) => {
    if (err) { return err };
    oAuth2Client.setCredentials(token);

    return await bucket.upload({
      Bucket: 'docs-resurfacer-access-tokens',
      Key: 'aaron-chen.json',
      Body: JSON.stringify(token)
    }).promise().then(res => {
      console.log('we got dat done.');
      return 'Successfully uploaded.'
    }).catch(err => {
      console.log(err);
    })
  });
}