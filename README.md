# Resurface old memories into your email.

A file resurfacer. Receive emails on notes you've written, quotes you've kept, and memories you've made.

## Rundown
---**to be finished**---

1. Deploy with your own credentials (eg. AWS, Google) and details (eg. email)
2. Manually authorize through the `authorize` function (*for now*) by going to the link that will be provided in console logs.
3. By authorizing, you'll sign in to Google to provide permissions and that'll hit the backend endpoint `process` that will update the S3 with your new creds.
4. When those credentials are successfully uploaded. Scheduling should work out of the box (default: `1 day`), and you should begin to receive emails! 

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

---**to be finished**---

## Stack
  - Node.js Typescript Serverless lambda
  - Google OAuth and Drive APIs
  - AWS SES and S3
  - Mustache templating

## Action Items 
- [x] Remove callbacks
- [ ] Integrate environment variables
- [ ] Tighten AWS policies
- [ ] Simplify document preview fetching
- [x] Update `authorize` function
- [ ] Email authorization link