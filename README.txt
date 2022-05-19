Need to have:

requirements.txt
- as per project required modules

Dockerfile
- change WORKDIR

project.env (used by docker-compose.yaml)
- modify COMPOSE_PROJECT_NAME
- modify ports (variables used in docker-compose.yaml)
- modify paths (variables used in docker-compose.yaml)


docker-compose.yaml
- define/modify containers


build/start/stop docker containers (uses docker-compose.yaml)
    build.sh
    up.sh
    down.sh
