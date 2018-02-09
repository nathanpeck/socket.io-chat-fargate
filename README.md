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

## Learn how its built

Check out the accompaying articles on how this was built and deployed on AWS:

- Part One: [Deploying to AWS Fargate](https://medium.com/containers-on-aws/building-a-socket-io-chat-app-and-deploying-it-using-aws-fargate-86fd7cbce13f)
- Part Two: [Making the application horizontally scale](https://medium.com/containers-on-aws/scaling-a-realtime-chat-app-on-aws-using-socket-io-redis-and-aws-fargate-4ed63fb1b681)
