run:
	docker-compose up -d

build:
	docker-compose build client
	docker-compose up --no-deps -d client

test:
	# Rebuild, recreate, and restart all the application containers
	docker compose build client test
	docker compose up -d --no-build --remove-orphans --no-deps client
	# Run the test container in the foreground so we get pretty color output in the terminal
	docker compose run --no-deps test
