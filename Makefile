run:
	docker-compose up -d

build:
	docker-compose build client
	docker-compose up --no-deps -d client

test:
	docker-compose build client
	docker-compose build test
	docker-compose run --no-deps -d client
	docker-compose run --no-deps test
