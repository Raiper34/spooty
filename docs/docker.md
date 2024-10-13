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
Name | Default | Description                                                                                                                                                       |
--- |---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
FORMAT | `mp3`   |  Format of downloaded files (currently fully supported only `mp3` but you can try whatever you want from [ffmpeg](https://ffmpeg.org/ffmpeg-formats.html#Muxers)) |