run:
	docker-compose up -d

build:
	docker-compose build client
	docker-compose up --no-deps -d client

test:
	docker compose up -d --build --remove-orphans --scale test=0
	docker-compose run --no-deps test
