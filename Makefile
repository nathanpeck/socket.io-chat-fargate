up:
	docker-compose up -d redis
	docker-compose up -d localstack
	docker-compose run bootstrap-resources
	docker-compose up --no-deps -d client
	docker-compose up --no-deps -d message-cards

down:
	docker-compose down

test:
	docker-compose build client
	docker-compose build message-cards
	docker-compose build test
	docker-compose up --no-deps -d client
	docker-compose up --no-deps -d message-cards
	docker-compose run --no-deps test

cards:
	docker-compose build message-cards
	docker-compose up --no-deps -d message-cards
	docker-compose run --no-deps test

clean:
	docker system prune -a -f
