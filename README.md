# Socket.IO Chat

![app](./docs/images/running-app.png)

A simple Slack-like chat app built with [Node.js](https://nodejs.org/en/) and [Vue.js](https://vuejs.org/) and deployed on Amazon Web Services, running in Docker containers in [AWS Fargate](https://aws.amazon.com/fargate/).

Features:

- Fully infrastructure as code, using [AWS CloudFormation](https://aws.amazon.com/cloudformation/) to create all the application resources
- CI/CD Pipeline using [AWS CodePipeline](https://aws.amazon.com/codepipeline/)
- Automated Docker builds using [AWS CodeBuild](https://aws.amazon.com/codebuild/)

You can view a running copy of this app, deployed on AWS at: [fargate.chat](https://fargate.chat)

## Deploy it yourself

This repository includes [instructions for how to deploy this application yourself](./docs/deploy.md), including buying your own Route 53 domain name, creating an SSL certificate, setting up the CI/CD pipeline.
