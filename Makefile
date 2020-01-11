.PHONY: test
test:
	python runtests.py

.PHONY: docker_test
docker_test:
	docker-compose run web make test
