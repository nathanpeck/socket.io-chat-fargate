run:
	docker-compose up -d

build:
	docker-compose build client
	docker-compose up --no-deps -d client

rebuild:
	docker-compose build --no-cache  dynamodb-local
	docker-compose build --no-cache  dynamodb-tables
	docker-compose build --no-cache  client
	docker-compose build --no-cache  test
	docker-compose build --no-cache  redis

test:
	docker-compose build client
	docker-compose build test
	docker-compose run --no-deps -d client
	docker-compose run --no-deps test
