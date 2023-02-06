run:
	npm run start

fauna-import:
	fauna import --path=./faunadb/collection --secret=secret --domain=localhost --scheme=http --port=8443

fauna-import-company:
	fauna import --path=./faunadb/collection/company.csv --type=createdAt::dateString --secret=secret --domain=localhost --scheme=http --port=8443

fauna-import-profile:
	fauna import --path=./faunadb/data/profile.csv --type=createdAt::dateString --secret=secret --domain=localhost --scheme=http --port=8443

fauna-import-test:
	fauna import --path=./faunadb/data/test.csv --type=createdAt::dateString --secret=secret --domain=localhost --scheme=http --port=8443

fauna-import-test_state:
	fauna import --path=./faunadb/data/test_state.csv --type=createdAt::dateString --secret=secret --domain=localhost --scheme=http --port=8443

fauna-import-user:
	fauna import --path=./faunadb/data/user.csv --secret=secret --domain=localhost --scheme=http --port=8443

fauna-postulant:
	fauna import --path=./faunadb/data/postulant.csv --secret=secret --domain=localhost --scheme=http --port=8443

fauna-test_postulant:
	fauna import --path=./faunadb/data/test_postulant.csv --secret=secret --domain=localhost --scheme=http --port=8443


fauna-shell:
	fauna shell --secret=secret --domain=localhost --scheme=http --port=8443

fauna-docker:
	docker run --rm --name faunadb -p 8443:8443 -p 8084:8084 -v faunadb-applicant:/var/lib/faunadb fauna/faunadb