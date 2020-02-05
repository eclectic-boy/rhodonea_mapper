.PHONY: test
test:
	python runtests.py

.PHONY: docker_test
docker_test:
	docker-compose run web make test

.PHONY: makemigrations
makemigrations:
	python makemigrations.py

.PHONY: docker_makemigrations
docker_makemigrations:
	docker-compose run web make makemigrations
