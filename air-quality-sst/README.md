# SST

SST is a framework that allows the creation of serverless infrastructure using code.

## Running

Run `npm ci` to install dependencies
Run `npm run dev` to run the backend locally  
Navigate to `packages/web` and `npm run dev` to run the web application

## Deploying

Run `npm run deployStage` to deploy to stage  
Run `npm run deployProd` to deploy to prod  
Note that new deployments require the API endpoint to be registered with Google for OAuth support

## Documentation

<https://docs.sst.dev/start/standalone>

## File Structure  

- `stacks`: Cloudformation Stacks  
- `packages`: Stack functions
  - `web`: Web app
  - `functions`: Lambda functions

## Authentication Notes

<https://docs.sst.dev/auth#cost>  
<https://sst.dev/examples/how-to-add-google-login-to-your-sst-apps.html>  
