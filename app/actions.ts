import Mustache from 'mustache';
import { google } from 'googleapis';
import { SES } from 'aws-sdk';

const ses = new SES();

export async function fetchDocuments(auth) {  
  const drive = google.drive({ version: 'v3', auth });

  // TODO: document caching -> cron cache clearer (1 week) + check cache -> then fetch

  let pageToken = null;
  let documentsList = [];

  // other fields: `webViewLink`, `thumbnailLink`
  do {
    const gResponse = await drive.files.list({
      q: `trashed = false and mimeType = 'application/vnd.google-apps.document' and createdTime >= '2020-08-21T00:00:00-00:00' and 'ilestkempo@gmail.com' in owners`,
      fields: 'nextPageToken, files(id, name, webViewLink)',
      spaces: 'drive',
      pageToken: pageToken
    }).then(r => r.data).catch(err => {
      console.log(err);
      throw new Error(err);
    });

    console.log(gResponse);

    pageToken = gResponse.nextPageToken;
    console.log('new token: ' + pageToken);
    documentsList = documentsList.concat(gResponse.files);
  } while (pageToken != null);

  console.log(`Pulled documents: ${documentsList.length}`);
}

function sendNewsletter(curatedList) {
  const template = `
    <h1>Documents</h1>
    <div>
      <ul>
        {{#docs}}
          <li>
            <h3>{{ title }}</h3>
            <p><a href="{{date}}">Link</a></p>
          </li>
        {{/docs}}
      </ul>
    </div>
    <p style="color:#CCC">{{ date }}</p>
  `;

  const view = {
    docs: curatedList,
    date: 'The date'
  };

  const html = Mustache.render(template, view);

  const params = {
    Destination: {
        ToAddresses: ["ilestkempo@gmail.com"]
    },
    Message: {
        Body: {
            Html: { Data: "..." },
            Text: { Data: "Test" }
        },
        Subject: { Data: "Aaron Chen" }
    },
    Source: "ilestkempo@gmail.com"
  };
}