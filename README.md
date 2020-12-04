# Resurface old memories into your email.

A file resurfacer. Receive emails on notes you've written, quotes you've kept, and memories you've made.

## Prerequisites
1. Setup AWS credentials on computer
2. Install Serverless

## How to Deploy & Run
1. You're gonna need a `credentials.json` and an `aws.json` file in the root directory.
- The `credentials.json` file will have the Google OAuth credentials which you download from them.
- Additionally make sure you have the proper `redirect_uris` set in `credentials.json`. This would probably mean `localhost:3000/dev/process` for development and `http://insert-lambda-url/dev/process` for a deployed app.
- The `aws.json` file will contain:
```
{
  "email": "hello@hello.com", // your email
  "userId": 1234567890, // your AWS user id
  "bucket": "bucket-name", // the name of the S3 bucket
  "file_name": "google-stuff.json" // the file within your S3 to fetch
}
```
2. Once you have the static files set up in root, you're going to need to authorize for the first time. Run the app in development with `sls offline` and go to the `/authorize` endpoint and authorize your Google account through the link provided.
3. Once you've provided permissions, the app will hit the `/process` endpoint with your credentials and save them to the S3 bucket you provided in `aws.json`. 
4. If everything goes well, you can deploy with `sls deploy` and scheduling would work out of the box (default: `1 day`) and you should begin to receive emails!

---**to be finished**---

## Stack
  - Node.js Typescript Serverless lambda
  - Google OAuth and Drive APIs
  - AWS SES and S3
  - Mustache templating

## Action Items 
- [x] Remove callbacks
- [x] Integrate environment variables
- [ ] Tighten AWS policies
- [ ] Simplify document preview fetching
- [x] Update `authorize` function
- [ ] Email authorization link