import { google } from 'googleapis';
import { S3 } from 'aws-sdk';
import credentials from '../credentials.json';

const bucket = new S3();

const SCOPES = ['https://www.googleapis.com/auth/documents.readonly', 
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/drive.readonly'];

// Load client secrets from a local file.
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

export async function getAuthorization() {
  return authorize();
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize() {
  // Check if there is already existing refresh/access tokens
  // Check from S3
  return await bucket.getObject({
    Bucket: 'docs-resurfacer-access-tokens',
    Key: 'aaron-chen.json'
  }).promise().then((data) => {
    console.log('Tokens successfully retrieved.');
    const pulledCredentials = JSON.parse(data.Body.toString());

    // convert file to readable
    // set OAuth with file
    oAuth2Client.setCredentials(pulledCredentials);
    console.log('Returning oAuth client...')

    return oAuth2Client;
  }).catch(err => {
    console.log('Getting new token...');
    const res = getNewToken();

    throw new Error(`Error: ${res}`);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
export function getNewToken() {
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

  oAuth2Client.getToken(code, async (err, token) => {
    if (err) { 
      console.log(err);
      return err 
    };

    oAuth2Client.setCredentials(token);

    return await bucket.upload({
      Bucket: 'docs-resurfacer-access-tokens',
      Key: 'aaron-chen.json',
      Body: JSON.stringify(token)
    }).promise().then(res => {
      console.log('Uploaded!');
      return 'Successfully uploaded.'
    }).catch(err => {
      console.log(err);
    })
  });

  return 'Processed token!'
}