import { onLoad, processToken } from './helpers';
import { google } from 'googleapis';

// Returns authorization url.
export async function authorize(event) {

  const res = await onLoad(() => { console.log('Authorization url posted.') });

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `${res}`
      }
    ),
  };
}

// Processes api credentials and saves them.
export async function process(event) {

  const code = event.queryStringParameters.code;
  console.log(`Provided code: ${code}`);

  const res = await processToken(code);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `${res}`
      }
    ),
  };
}

export async function register(event) {

  // login with Google
  // send initial email to authorize
  // add email to DB

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `Registered. Emails will be sent to ${`test@test.com`}`
      }
    ),
  };
}

export async function remove(event) {

  // remove email from DB

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `Removed ${`test@test.com`}`
      }
    ),
  };
}

export async function scheduled(event) {
  // send out both docs and also a reauthorization link
  // call `authorize`

  const res = await onLoad(fetchDocuments);

  const time = new Date();
  console.log(`Logging data at ${time}`);
}

// application/vnd.google-apps.document	

async function fetchDocuments(auth) {
  console.log('call back!');
  
  const drive = google.drive({ version: 'v3', auth });

  // loop through until `pageToken` is null

  var pageToken = null;

  const documents = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.document'`,
    fields: 'nextPageToken, files(id, name)',
    spaces: 'drive',
    pageToken: pageToken
  })

  console.log(documents.data.files);
}