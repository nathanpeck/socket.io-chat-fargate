# Architecture

![app](./docs/architecture.png)

This is a chat application that demonstrates the usage of the following AWS compute service:

- AWS App Runner
- AWS Elastic Container Service + AWS Fargate
- AWS Lambda

It also makes use of the following AWS services:

- Amazon DynamoDB
- Amazon OpenSearch Serverless
- Amazon ElastiCache
- Amazon API Gateway
- Application Load Balancer
- AWS CloudFront


### AWS App Runner

App Runner is being used to host the static web content for the frontend of the website. Although this single page app does not currently do an server side rendering, this is place where server side rendering would occur.

### AWS Elastic Container Service + AWS Fargate

The core chat feature is powered by a WebSocket application. This
application is hosted in AWS Fargate, and orchestrated by AWS Elastic Container Service. Ingress to the socket application is via an Application Load Balancer. The core socket application stores durable data like user accounts and chat messages in Amazon DynamoDB. It also syncs state between the server containers using ElastiCache pubsub. This includes storing ephemeral data like chat presence and typing status.

### AWS Lambda

Lambda functions are used as an event driven workflow for indexing search messages. As messages are stored in the DynamoDB table, it triggers a DynamoDB Stream event which runs an asynchronous Lambda function which adds the chat message to a search index in Amazon OpenSearch Serverless. Additionally, there is a search endpoint powered by Amazon API Gateway.

### Amazon DynamoDB

This is the main durable store of state for the application. It stores the user accounts and chat messages that are sent. It also provides an event stream which triggers the search indexing Lambda fucntion when chat messages are sent.

### Amazon OpenSearch Serverless

OpenSearch Serverless is an open source, distributed search and analytics suite derived from Elasticsearch. It is used to index all the chat messages to power the search feature of the application.

### Amazon ElastiCache

ElastiCache provides a Redis cluster that is used in pubsub mode for syncing chat messages from one websocket server to another. It also serves as an in-memory data store for chat presence and typing status.

### Amazon API Gateway

This is a serverless ingress for the search endpoint. When a search query is sent it will charge per request sent, but have no overhead cost otherwise.

### Application Load Balancer

The Application Load Balancer is used to distribute incoming requests across the available WebSocket servers. It maintains persistant bidirectional WebSocket connection so that chat clients can push chat messages to the server, and the server can push chat messages out to the clients as they arrive.

### AWS CloudFront

CloudFront is used as the front facing content delivery network for all three components. It routes request for static web content to the App Runner container, WebSocket requests to the AWS Fargate hosted container, and search queries to the API Gateway for the Lambda powered search function.