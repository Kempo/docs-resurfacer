import Mustache from 'mustache';
import { google } from 'googleapis';
import { SES } from 'aws-sdk';

const ses = new SES({ region: 'us-east-1' });

export async function fetchDocuments(auth) {  
  const drive = google.drive({ version: 'v3', auth });

  // TODO: document caching -> cron cache clearer (1 week) + check cache -> then fetch
  // or key-based cache expiration ? See Lutke or DHH blog post

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

    // console.log(gResponse);

    pageToken = gResponse.nextPageToken;
    // console.log('new token: ' + pageToken);
    documentsList = documentsList.concat(gResponse.files);
  } while (pageToken != null);

  console.log(`Pulled documents: ${documentsList.length}`);

  await sendNewsletter(partitionList(documentsList)).then(res => {
    console.log('sent!');
    console.log(res);
  }).catch(err => {
    console.log(err);
  });
}

function partitionList(list) {
  // gets the first five for now
  return list.slice(0, 5);
}

function sendNewsletter(curatedList: any[]) {
  console.log(curatedList);

  const template = `
    <h1>Documents</h1>
    <div>
      <ul>
        {{#docs}}
          <li>
            <h3>{{ name }}</h3>
            <p><a href="{{ webViewLink }}">Link</a></p>
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
  console.log(html);

  const params = {
    Destination: {
        ToAddresses: ["ilestkempo@gmail.com"]
    },
    Message: {
        Body: {
            Html: { Data: html },
            Text: { Data: "Documents List" }
        },
        Subject: { Data: "Documents by Aaron Chen" }
    },
    Source: "ilestkempo@gmail.com"
  };

  return ses.sendEmail(params).promise();
}