# How to deploy this application on AWS

## 1. Setup a copy of the Github repo for CI/CD

First clone this repo onto your Github account by clicking the "Fork" button in the upper right:

<img src='https://github.com/nathanpeck/socket.io-chat-fargate/raw/master/docs/images/github-fork.png' width='25%' />

Then go to your [Github settings to generate a new token](https://github.com/settings/tokens). Click on "Generate new token" and create a token which has the following access:

- `admin:repo_hook`
- `repo`

These two permissions will allow AWS CodePipeline to monitor the Github repo for changes, and react to updates by redeploying the application.

## 2. Deploy the CodePipeline on your account

Download the repository using `git clone` and once the source is on your machine look for the file `pipeline.yml` in the top directory of the repo. This is a CloudFormation template which creates a CI/CD pipeline.

Go to [AWS CloudFormation](https://console.aws.amazon.com/cloudformation/home) and click the "Create Stack" button. In the following dialog click "Choose File" and select the `pipeline.yml` file you located, then click "Next". You will see a list of input parameters. Fill them in with the appropriate values:

<img src='https://github.com/nathanpeck/socket.io-chat-fargate/raw/master/docs/images/cloudformation-template-parameters.png' width='50%' />

Click Next twice, select the checkbox next to "I acknowledge that AWS CloudFormation might create IAM resources." and then click "Create". You will see a CloudFormation template in the `CREATE_IN_PROGRESS` state.

<img src='https://github.com/nathanpeck/socket.io-chat-fargate/raw/master/docs/images/pipeline-create.png' width='50%' />

This template is creating an AWS CodePipeline for you. You can view the [source of the template](../pipeline.yml) in the meantime to understand what is being setup.

After about a minute you will see another CloudFormation template appear:

<img src='https://github.com/nathanpeck/socket.io-chat-fargate/raw/master/docs/images/pipeline-done.png' width='50%' />

This template was automatically deployed by the pipeline itself. To understand how this happened visit [AWS CodePipeline](https://console.aws.amazon.com/codepipeline/home) in your AWS console and click to view the details of the pipeline:

<img src='https://github.com/nathanpeck/socket.io-chat-fargate/raw/master/docs/images/pipeline-view.png' width='50%' />

As you can see there are a few stages to the build:

- `Source` (Access the Github repo and pull the latest code)
- `BaseResources` (This CloudFormation template deploys the basic VPC, networking, and application load balancer for the application stack)
- `ChatResources` (This CloudFormation template deploys an ElastiCache Redis, DynamoDB tables and any other resources the chat service needs)
- `Build` (This is an AWS CodeBuild which builds the docker image and uploads it to AWS Elastic Container Registry)
- `Deploy` (This is a CloudFormation template creates an ECS service and task definition and gets the application container running AWS Fargate)

Once the stages are all done you will see a list of CloudFormation templates that have been deployed:

<img src='https://github.com/nathanpeck/socket.io-chat-fargate/raw/master/docs/images/cloudformation-template-list.png' width='50%' />

## 3. Load up the application

After you wait a while for DNS to propagate you can then type in the DNS name that you just created in your browser and see your running copy of the chat app!

![running app](./images/running-app.png)

## 4. Make a change!

Feel free to modify your local copy of the application in your repository. Do a `git commit` and `git push` to push your changes up to Github. CodePipeline will pick up the changes and rereun the pipeline to rebuild the application and roll out your updates with zero downtime.

Enjoy the CI/CD process!



