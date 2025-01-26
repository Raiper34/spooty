# Docker

Recommended and the easiest way how to start to use of Spooty is using docker.
Just run docker command or use docker compose configuration. 

### Docker command
```shell
docker run -d -p 3000:3000 -v /path/to/downloads:/spooty/backend/downloads raiper34/spooty:latest
```

### Docker compose
```yaml
services:
  spooty:
    image: raiper34/spooty:latest
    container_name: spooty
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - /path/to/downloads:/spooty/backend/downloads
```

### Environment variables

For detailed configuration, see available [Environment variables](variables.md).