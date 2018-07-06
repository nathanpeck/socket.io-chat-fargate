run:
	docker-compose up -d

build:
	docker-compose build client
	docker-compose up --no-deps -d client

test:
	docker-compose build client
	docker-compose build message-cards
	docker-compose build test
	docker-compose up --no-deps -d client
	docker-compose up --no-deps -d message-cards
	docker-compose run --no-deps test
