import { getAuthorization, processToken, getNewToken } from './google-auth';
import { startScheduledEmail } from './actions';

// Returns a manual authorization url.
// TODO: seems to not be entirely necessary, so may remove.
export async function authorize(event) {

  const res = getNewToken();

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

export async function scheduled(event, context) {
  // send out both docs and also a reauthorization link
  // call `authorize`
  console.log('Scheduled function!');
  console.log(`Request Id: ${context.awsRequestId}`);

  await getAuthorization().then(startScheduledEmail);
}