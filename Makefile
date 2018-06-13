run:
	docker-compose up -d

build:
	docker-compose build client
	docker-compose up --no-deps -d client
