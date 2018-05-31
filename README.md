# Socket.IO Chat

A simple chat demo for socket.io

## How to use

```
$ npm install
$ npm start
```

And point your browser to `http://localhost:3000`. Optionally, specify
a port by supplying the `PORT` env variable.

## Deploy on AWS

- Must have a domain name hosted in Route53 and create an Amazon Certificate Manager SSL cert for the domain name.
- Fork the repo and create a Github token.
- Deploy the `pipeline.yml` CloudFormation stack. You will need to enter your repo name and the Github token, as well as the ARN of the certificate.
- The CloudFormation template will deploy a CodePipeline that will deploy the rest of the resources onto your account.
- Finally create a Route53 recommend pointing at the URL of the load balancer, obtainable from the output of the `cluster.yml` CloudFormation stack that was deployed by the pipeline.
