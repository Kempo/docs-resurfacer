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
  }).catch(() => {
    const res = getNewToken();

    throw new Error(`Please authorize here: ${res}`);
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

  return authUrl;
}

export function processToken(code) {
  return oAuth2Client.getToken(code).then(async ({ tokens }) => {

    // TODO: use oAuth2Client to send email -> confirmation
    // oAuth2Client.setCredentials(tokens);

    const bucketName = process.env.bucket;
    const fileName = process.env.file_name;

    const params: S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: fileName,
      Body: JSON.stringify(tokens)
    }

    return bucket.upload(params).promise();
  });
}