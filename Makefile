build:
	docker build -t dynamodb-local ./deps/dynamodb-local
	docker build -t fargate-chat ./services/client/src

run: build
	if [ ! "$(shell docker network ls | grep chat)" ]; then docker network create chat; fi
	docker run -d --rm --name dynamodb-local --network chat dynamodb-local
	docker run -d --rm --name redis --network chat redis
	docker run -d --name fargate-chat --network chat -e "REDIS_ENDPOINT=redis" -e "DYNAMODB_ENDPOINT=dynamodb-local" fargate-chat

test: run
	docker logs fargate-chat

clean:
	# Destroy the app container
	- docker stop fargate-chat
	- docker rm fargate-chat
	- docker rmi fargate-chat

cleanall: clean
	# Destroy the DynamoDB local container
	- docker stop dynamodb-local
	- docker rmi dynamodb-local

	# Destroy the Redis container
	- docker stop redis
	- docker rmi redis


