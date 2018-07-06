# Local Users table
RESULT=$(aws dynamodb describe-table \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --table-name test_Users)
if [ $? -eq 0 ]; then
  aws dynamodb delete-table \
    --region us-east-1 \
    --endpoint-url $DYNAMODB_ENDPOINT \
    --table-name test_Users
fi
aws dynamodb create-table \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --table-name test_Users \
  --key-schema AttributeName=username,KeyType=HASH \
  --attribute-definitions AttributeName=username,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10

# Local Messages table
RESULT=$(aws dynamodb describe-table \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --table-name test_Messages)
if [ $? -eq 0 ]; then
  aws dynamodb delete-table \
    --region us-east-1 \
    --endpoint-url $DYNAMODB_ENDPOINT \
    --table-name test_Messages
fi
aws dynamodb create-table \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --table-name test_Messages \
  --key-schema AttributeName=room,KeyType=HASH AttributeName=message,KeyType=RANGE \
  --attribute-definitions AttributeName=room,AttributeType=S AttributeName=message,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10

# Local SQS queue
RESULT=$(aws sqs get-queue-url \
  --region us-east-1 \
  --endpoint-url $SQS_ENDPOINT \
  --queue-name test_Messages)
if [ $? -eq 0 ]; then
  echo "Delete queue";
  echo $RESULT;
fi
aws sqs create-queue \
    --region us-east-1 \
    --endpoint-url $SQS_ENDPOINT \
    --queue-name test_Messages
