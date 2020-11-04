import { onLoad, processToken } from './google-auth';
import { fetchDocuments } from './actions';

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

export async function scheduled(event) {
  // send out both docs and also a reauthorization link
  // call `authorize`

  const res = await onLoad(fetchDocuments);

  const time = new Date();
  console.log(`Logging data at ${time}`);
}