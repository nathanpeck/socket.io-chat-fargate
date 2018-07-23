# Make sure that the localstack resources are up first.
./wait-for-it.sh $SNS_ENDPOINT
./wait-for-it.sh $SQS_ENDPOINT
./wait-for-it.sh $DYNAMODB_ENDPOINT

aws dynamodb list-tables \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --cli-connect-timeout 1 \
  --cli-read-timeout 1

ENV_NAME="test";

# Local Users table
TABLE_NAME="Users";
RESULT=$(aws dynamodb describe-table \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --table-name ${ENV_NAME}_${TABLE_NAME})
if [ $? -eq 0 ]; then
  echo "Delete existing table ${TABLE_NAME}";
  aws dynamodb delete-table \
    --region us-east-1 \
    --endpoint-url $DYNAMODB_ENDPOINT \
    --table-name ${ENV_NAME}_${TABLE_NAME}
fi
echo "Create table ${TABLE_NAME}";
aws dynamodb create-table \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --table-name ${ENV_NAME}_${TABLE_NAME} \
  --key-schema AttributeName=username,KeyType=HASH \
  --attribute-definitions AttributeName=username,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10

# Local Messages table
TABLE_NAME="Messages";
RESULT=$(aws dynamodb describe-table \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --table-name ${ENV_NAME}_${TABLE_NAME})
if [ $? -eq 0 ]; then
  echo "Delete existing table ${TABLE_NAME}";
  aws dynamodb delete-table \
    --region us-east-1 \
    --endpoint-url $DYNAMODB_ENDPOINT \
    --table-name ${ENV_NAME}_${TABLE_NAME}
fi
echo "Create table ${TABLE_NAME}";
aws dynamodb create-table \
  --region us-east-1 \
  --endpoint-url $DYNAMODB_ENDPOINT \
  --table-name ${ENV_NAME}_${TABLE_NAME} \
  --key-schema AttributeName=room,KeyType=HASH AttributeName=message,KeyType=RANGE \
  --attribute-definitions AttributeName=room,AttributeType=S AttributeName=message,AttributeType=S \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10

# Local SQS queue
QUEUE_NAME="MessagesToCardify";
RESULT=$(aws sqs get-queue-url \
  --region us-east-1 \
  --endpoint-url $SQS_ENDPOINT \
  --queue-name ${ENV_NAME}_${QUEUE_NAME})
if [ $? -eq 0 ]; then
  echo "Delete queue ${QUEUE_NAME}";
  aws sqs delete-queue \
    --region us-east-1 \
    --endpoint-url $SQS_ENDPOINT \
    --queue-url $SQS_ENDPOINT/queue/${ENV_NAME}_${QUEUE_NAME}
fi
echo "Create queue ${QUEUE_NAME}";
aws sqs delete-queue \
    --region us-east-1 \
    --endpoint-url $SQS_ENDPOINT \
    --queue-url $SQS_ENDPOINT/queue/${ENV_NAME}_${QUEUE_NAME}
aws sqs create-queue \
    --region us-east-1 \
    --endpoint-url $SQS_ENDPOINT \
    --attributes VisibilityTimeout=60 \
    --queue-name ${ENV_NAME}_${QUEUE_NAME}

# Local SNS topic
TOPIC_NAME="MessageSent"
TOPIC_ARN="arn:aws:sns:us-east-1:123456789012:${ENV_NAME}_${TOPIC_NAME}"
echo "Create topic ${TOPIC_NAME}";
SUBSCRIPTION_ARN=$(aws sns list-subscriptions-by-topic \
  --region us-east-1 \
  --endpoint-url $SNS_ENDPOINT \
  --topic-arn $TOPIC_ARN \
  --query Subscriptions[0].SubscriptionArn \
  --output text)
aws sns unsubscribe \
  --region us-east-1 \
  --endpoint-url $SNS_ENDPOINT \
  --subscription-arn $SUBSCRIPTION_ARN
aws sns delete-topic \
  --region us-east-1 \
  --endpoint-url $SNS_ENDPOINT \
  --topic-arn $TOPIC_ARN
aws sns create-topic \
  --region us-east-1 \
  --endpoint-url $SNS_ENDPOINT \
  --name ${ENV_NAME}_${TOPIC_NAME}

# Subscription between the SQS queue and the SNS topic
echo "Create subscription between topic ${TOPIC_NAME} and queue ${QUEUE_NAME}"
aws sns subscribe \
  --region us-east-1 \
  --endpoint-url $SNS_ENDPOINT \
  --topic-arn $TOPIC_ARN \
  --protocol sqs \
  --notification-endpoint $SQS_ENDPOINT/queue/${ENV_NAME}_${QUEUE_NAME}
aws sns list-subscriptions-by-topic \
  --region us-east-1 \
  --endpoint-url $SNS_ENDPOINT \
  --topic-arn $TOPIC_ARN



