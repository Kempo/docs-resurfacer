import Mustache from 'mustache';
import { google } from 'googleapis';
import { SES } from 'aws-sdk';
import fs from 'fs';

const MOST_RECENT_COUNT = 3;
const RANDOMIZED_COUNT = 3;

const ses = new SES({ region: 'us-east-1' });

export async function startScheduledEmail(auth) {
  return await fetchDocuments(auth)
                .then(fetchTemplate)
                .then(sendNewsletter)
                .then((res) => {
                  console.log(`Email sent at ${Date.now()}`);
                  return res;
                })
}

async function fetchDocuments(auth) {  
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

    pageToken = gResponse.nextPageToken;
    documentsList = documentsList.concat(gResponse.files);
  } while (pageToken != null);

  console.log(`Pulled documents: ${documentsList.length}`);
  const documentPartitions = partitionList(documentsList);

  return documentPartitions;
}

// fetches some most recent docs along with randomized historical ones
function partitionList(list: any[]) {

  const size = list.length;

  const head = list.slice(0, MOST_RECENT_COUNT);
  const tail = list.slice(MOST_RECENT_COUNT, size);
  const indices = new Set();
  const generated = [];

  // generate `RANDOMIZED_COUNT` (x) of randomized indices of tail
  for(let count = 0; count < RANDOMIZED_COUNT; count++) {
    let index = Math.floor(Math.random() * Math.floor(tail.length));
    if(indices.has(index)) {
      count--;
    }else{
      indices.add(index);
    }
  }

  indices.forEach((i: number) => {
    generated.push(tail[i])
  });

  return {
    latest: head,
    randomized: generated
  }
}

function fetchTemplate({ latest, randomized }) {
  const template = fs.readFileSync('app/resources/template.html').toString();
  const styles = fs.readFileSync('app/resources/style.css').toString();

  const view = {
    styles: `<style>${styles}</style>`,
    latest,
    randomized,
    date: new Date().toLocaleDateString(),
  };

  const html = Mustache.render(template, view);

  console.log(html);

  return html;
}

function sendNewsletter(html: string) {
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