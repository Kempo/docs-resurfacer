import Mustache from 'mustache';
import { drive_v3, google } from 'googleapis';
import { SES } from 'aws-sdk';
import fs from 'fs';

import { blacklist as DOC_ID_FILTER, favorites as FAVORITES } from './resources/lists';

const MOST_RECENT_COUNT = 3;
const RANDOMIZED_COUNT = 3;
const PREVIEW_LENGTH = 125;

const ses = new SES({ region: 'us-east-1' });

export async function startScheduledEmail(auth) {
  console.log('Starting scheduled email.');

  return await fetchDocuments(auth)
                .then(fetchTemplate)
                .then(sendNewsletter)
                .then((res) => {
                  console.log(`Email sent at ${Date.now()}`);
                  return res;
                });
}

async function fetchDocuments(auth) {  
  const drive = google.drive({ version: 'v3', auth });

  console.log('Fetching documents...');

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
    const rawDocuments = gResponse.files;
    const output = rawDocuments.filter(doc => !DOC_ID_FILTER.includes(doc.id));

    pageToken = gResponse.nextPageToken;
    documentsList = documentsList.concat(output);
  } while (pageToken != null);

  console.log(`Pulled documents: ${documentsList.length}`);

  const partition = await partitionList(documentsList, drive);
  return partition;
}

// fetches some most recent docs along with randomized historical ones
async function partitionList(fullList: any[], drive) {

  // avoid using `splice` and mutating the original list
  const starred = fullList.filter(doc => FAVORITES.includes(doc.id));

  const allUnstarred = fullList.filter(doc => !FAVORITES.includes(doc.id));

  const size = allUnstarred.length;

  const head = allUnstarred.slice(0, MOST_RECENT_COUNT);
  const tail = allUnstarred.slice(MOST_RECENT_COUNT, size);
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
    starred: await updateDocsWithPreview(starred, drive),
    latest: await updateDocsWithPreview(head, drive),
    randomized: await updateDocsWithPreview(generated, drive)
  }
}

async function updateDocsWithPreview(list: any[], drive: drive_v3.Drive) {
  return await Promise.all(list.map(async document => {
    const gResponse = await drive.files.export({
      fileId: document.id,
      mimeType: 'text/plain',
    });

    const fullText = <unknown>gResponse.data as string;

    return {
      ...document,
      previewText: fullText.substring(0, PREVIEW_LENGTH)
    }
  })); 
}

function fetchTemplate({ latest, randomized, starred }) {

  /*
  const pathName = (file) => process.env.LAMBDA_TASK_ROOT
    ? path.resolve(process.env.LAMBDA_TASK_ROOT, file)
    : path.resolve(__dirname, file);

  const t = pathName('template.html');
  */

  const template = fs.readFileSync(`${__dirname}/resources/email/template.html`).toString();
  const styles = fs.readFileSync(`${__dirname}/resources/email/style.css`).toString();

  const view = {
    styles: `<style>${styles}</style>`,
    latest,
    randomized,
    starred,
    date: new Date().toLocaleDateString(),
  };

  const html = Mustache.render(template, view);

  return html;
}

async function sendNewsletter(html: string) {
  console.log('Sending newsletter now...');

  const params = {
    Destination: {
        ToAddresses: ["ilestkempo@gmail.com"]
    },
    Message: {
        Body: {
            Html: { Data: html },
            Text: { Data: "Documents List" }
        },
        Subject: { Data: "Notes to self / Aaron Chen" }
    },
    Source: "ilestkempo@gmail.com"
  };

  return ses.sendEmail(params).promise();
}