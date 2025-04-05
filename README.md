[![npm version](https://img.shields.io/docker/pulls/raiper34/spooty)](https://hub.docker.com/r/raiper34/spooty)
[![npm version](https://img.shields.io/docker/image-size/raiper34/spooty)](https://hub.docker.com/r/raiper34/spooty)
[![npm version](https://img.shields.io/docker/stars/raiper34/spooty)](https://hub.docker.com/r/raiper34/spooty)
[![GitHub License](https://img.shields.io/github/license/raiper34/spooty)](https://github.com/Raiper34/spooty)
[![GitHub Repo stars](https://img.shields.io/github/stars/raiper34/spooty)](https://github.com/Raiper34/spooty)

![spooty logo](assets/logo.svg)
# Spooty - selfhosted Spotify downloader
Spooty is a self-hosted Spotify downloader.
It allows download track/playlist/album from the Spotify url.
It can also subscribe to a playlist or author page and download new songs upon release.
Spooty basically downloads nothing from Spotify, it only gets information from spotify and then finds relevant and downloadeds music on Youtube. 
The project is based on NestJS and Angular.

> [!IMPORTANT]
> Please do not use this tool for piracy! Download only music you own rights! Use this tool only on your responsibility.

![demo](assets/demo.gif)

### Content
- [🚀 Installation](#-installation)
  - [Docker](#docker)
    - [Docker command](#docker-command)
    - [Docker compose](#docker-compose)
  - [Build from source](#build-from-source)
    - [Process](#requirements)
    - [Requirements](#process)
  - [Environment variables](#environment-variables)
- [⚖️ License](#-license)

## 🚀 Installation
Recommended and the easiest way how to start to use of Spooty is using docker.

### Docker

Just run docker command or use docker compose configuration.
For detailed configuration, see available [environment variables](#environment-variables).

#### Docker command
```shell
docker run -d -p 3000:3000 -v /path/to/downloads:/spooty/backend/downloads raiper34/spooty:latest
```

#### Docker compose
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

### Build from source

Spooty can be also build from source files on your own.

#### Requirements
- Node v18.19.1 (it is recommended to use `nvm` node version manager to install proper version of node)
- Redis in memory cache

#### Process
- install Node v18.19.1 using `nvm install` and use that node version `nvm use`
- from project root install all dependencies using `npm install`
- copy `.env.default` as `.env` in `src/backend` folder and modify desired environment properties (see [environment variables](#environment-variables))
- build source files `npm run build`
    - built project will be stored in `dist` folder
- start server `npm run start`

### Environment variables

Some behaviour and settings of Spooty can be configured using environment variables and `.env` file.

 Name           | Default                                     | Description                                                                                                                                                      |
----------------|---------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
 DB_PATH        | `./config/db.sqlite` (relative to backend)  | Path where Spooty database will be stored                                                                                                                        |
 FE_PATH        | `../frontend/browser` (relative to backend) | Path to frontend part of application                                                                                                                             |
 DOWNLOADS_PATH | `./downloads` (relative to backend)         | Path where downaloded files will be stored                                                                                                                       |
 FORMAT         | `mp3`                                       | Format of downloaded files (currently fully supported only `mp3` but you can try whatever you want from [ffmpeg](https://ffmpeg.org/ffmpeg-formats.html#Muxers)) |
 PORT           | 3000                                        | Port of Spooty server                                                                                                                                            |
 REDIS_PORT     | 6379                                        | Port of Redis server                                                                                                                                             |
 REDIS_HOST     | localhost                                   | Host of Redis server                                                                                                                                             |
 RUN_REDIS      | false                                       | Whenever Redis server should be started from backend (recommended for Docker environment)                                                                        |

# ⚖️ License
[MIT](https://choosealicense.com/licenses/mit/)
