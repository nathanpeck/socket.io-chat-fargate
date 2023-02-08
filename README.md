# Fargate.chat

Install if not already installed:

* Docker: https://docs.docker.com/get-docker/
* AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

```
export AWS_REGION=us-west-2

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
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin 228578805541.dkr.ecr.us-west-2.amazonaws.com

# Build the Docker image
docker build -t fargate-chat ./services/client

# Upload the built container image to the repository
docker tag fargate-chat:latest 228578805541.dkr.ecr.us-west-2.amazonaws.com/fargate-chat:latest
docker push 228578805541.dkr.ecr.us-west-2.amazonaws.com/fargate-chat:latest

# Start up the container that runs in AWS Fargate
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/chat-service.yml \
  --stack-name chat-service \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides ImageUrl=228578805541.dkr.ecr.us-west-2.amazonaws.com/fargate-chat:latest

# IN PROGRESS - Deploy the component which indexes sent chat messages
sam deploy \
  --region $AWS_REGION \
  --template-file infrastructure/message-indexer.yml \
  --stack-name chat-message-indexer \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM

# TODO - Deploy the component which provides search autocomplete and API Gateway

# TODO - Deploy CloudFront distribution which ties main app and search endpoint together on one domain

# Get the application URL to view it
aws cloudformation describe-stacks \
  --stack-name chat-cluster \
  --query "Stacks[0].Outputs[?OutputKey==\`ExternalUrl\`].OutputValue" \
  --output text

# Open the URL in the browser window

```