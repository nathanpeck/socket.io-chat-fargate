# Socket.IO Chat

A simple chat demo for socket.io

## How to run locally

```
docker build -t chat .
docker network create chatapp
docker run -d --net=chatapp --name redis redis
docker run -d --net=chatapp --name chat1 -p 3000:3000 -e "REDIS_ENDPOINT=redis" chat
```

And point your browser to `http://localhost:3000`.

## Live Demo

You can view a running copy of this app, deployed on AWS at: [fargate.chat](https://fargate.chat)

- Must have a domain name hosted in Route53 and create an Amazon Certificate Manager SSL cert for the domain name.
- Fork the repo and create a Github token.
- Deploy the `pipeline.yml` CloudFormation stack. You will need to enter your repo name and the Github token, as well as the ARN of the certificate.
- The CloudFormation template will deploy a CodePipeline that will deploy the rest of the resources onto your account.
- Finally create a Route53 recommend pointing at the URL of the load balancer, obtainable from the output of the `cluster.yml` CloudFormation stack that was deployed by the pipeline.
