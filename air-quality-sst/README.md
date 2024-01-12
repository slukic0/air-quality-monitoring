# SST

SST is a framework that allows the creation of serverless infrastructure using code.

## Running

Run `npm run dev` to test lambda and other services locally  

## Deploying

Run `npm run deployStage` to deploy to stage  
Run `npm run deployProd` to deploy to prod  

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
