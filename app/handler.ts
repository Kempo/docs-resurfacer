import { getAuthorization, processToken, getNewToken } from './google-auth';
import { startScheduledEmail } from './actions';

// Processes api credentials and saves them.
export async function process(event) {

  const code = event.queryStringParameters.code;
  console.log(`Provided code: ${code}`);

  const response = await processToken(code).then(() => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processed token!'
      })
    }
  }).catch(err => {
    throw new Error(err);
  });

  return response;
}

// Manually returns the authorization link.
export async function authorize() {

  const authUrl = getNewToken();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Please authorize here: ${authUrl}`
    })
  }
}

// Starts the scheduled email.
export async function scheduled(_, context) {
  console.log(`Request Id: ${context.awsRequestId}`);

  await getAuthorization().then(startScheduledEmail);
}