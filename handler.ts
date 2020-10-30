import { onLoad } from './helpers';

export async function version(event) {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        version: 1.0
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

  const time = new Date();
  console.log(`Logging data at ${time}`);
}