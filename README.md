# Fargate.chat

Install if not already installed:

* Docker: https://docs.docker.com/get-docker/
* AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
* Install Node and NPM if not present

```
# Setup some env variables for later
export AWS_REGION=us-east-2
export AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# Install the dependencies off of NPM
(cd services/message-indexer; npm install)
(cd services/message-search; npm install)

# Setup the base VPC and networking stuff.
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/cluster.yml \
  --stack-name chat-cluster \
  --capabilities CAPABILITY_IAM

# The shared resources like DynamoDB table and OpenSearch Serverless
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/resources.yml \
  --stack-name chat-resources \
  --capabilities CAPABILITY_IAM

# Create an ECR repository to host the container image
aws ecr create-repository \
  --region $AWS_REGION \
  --repository-name fargate-chat

# Login to the ECR repository
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Build the Docker image
docker build -t fargate-chat ./services/socket

# Upload the built container image to the repository
docker tag fargate-chat:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/fargate-chat:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/fargate-chat:latest

# Start up the container that runs in AWS Fargate
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/chat-service.yml \
  --stack-name chat-service \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides ImageUrl=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/fargate-chat:latest

# IN PROGRESS - Deploy the component which indexes sent chat messages
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/message-indexer.yml \
  --stack-name chat-message-indexer \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM

# Deploy the component which provides search autocomplete and API Gateway
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/message-search.yml \
  --stack-name chat-message-search \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM

# Build the component which hosts static web content
aws ecr create-repository \
  --region $AWS_REGION \
  --repository-name apprunner-web

# Build the Docker image
docker build -t apprunner-web ./services/web

# Upload the built container image to the repository
docker tag apprunner-web:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/apprunner-web:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/apprunner-web:latest

# Launch the web container inside of App Runner
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/web.yml \
  --stack-name chat-web \
  --resolve-s3 \
  --parameter-overrides ImageUrl=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/apprunner-web:latest \
  --capabilities CAPABILITY_IAM

# TODO - Deploy CloudFront distribution which ties main app and search endpoint together on one domain
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/cloudfront.yml \
  --stack-name chat-cloudfront \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM

# Get the application URL to view it
aws cloudformation describe-stacks \
  --stack-name chat-cloudfront \
  --query "Stacks[0].Outputs[?OutputKey==\`PublicURL\`].OutputValue" \
  --output text

# Open the URL in the browser window

```

## Project layout

```
/deps - Folder used only for local development purposes
/infrastructure - CloudFormation templates used for deployment to AWS
/services - Independent code components that make up the app
  /socket - The core Node.js socket.io app, which runs in AWS Fargate
  /message-indexer - Lambda function which triggers on DynamoDB updates, to index chat messages
  /message-search - Lamdba function triggered by API Gateway, answers search queries
  /test-suite - Container used for local tests, runs integ tests against socket service
  /message-index-drop - Admin Lambda function which drops the OpenSearch Serverless collection
  /web - Frontend service which serves the static web files in production
```

## Admin and dev actions

If you want to drop the search index (will be recreated next time you send a message, though older messages will no longer be remembered)

```
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/message-index-drop.yml \
  --stack-name chat-index-drop \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM
```

Run a local copy of the socket app for testing:

```
make run    # Standup local DynamoDB and local stack
make test   # Rebuild and run tests locallt

# Open localhost:3000 in browser to view app
```
