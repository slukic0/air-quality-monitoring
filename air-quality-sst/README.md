# SST

## Documentation  
https://docs.sst.dev/start/standalone

## Cognito
https://sst.dev/examples/how-to-add-cognito-authentication-to-a-serverless-api.html  
https://sst.dev/examples/how-to-add-jwt-authorization-with-cognito-user-pool-to-a-serverless-api.html  

### Creating Cognito users from the AWS CLI
 ```
 aws cognito-idp sign-up \
  --region us-east-1 \
  --client-id 4fb69je3470cat29p0nfm3t27k \
  --username user@email.com \
  --password pwd
```
Replace --client-id with `UserPoolClientId`  

### Verifying Cognito users from the AWS CLI
 ```
aws cognito-idp admin-confirm-sign-up \
  --region us-east-1 \
  --user-pool-id us-east-1_jyRNx41BD \
  --username user@email.com
```
Replace --user-pool-id with `UserPoolId` 