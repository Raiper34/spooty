[![npm version](https://img.shields.io/docker/pulls/raiper34/spooty)](https://hub.docker.com/r/raiper34/spooty)
[![npm version](https://img.shields.io/docker/image-size/raiper34/spooty)](https://hub.docker.com/r/raiper34/spooty)
![Docker Image Version](https://img.shields.io/docker/v/raiper34/spooty)
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

### Content
- [🚀 Installation](#-installation)
  - [Spotify App Configuration](#spotify-app-configuration)
  - [Authentication & Default Admin User](#authentication--default-admin-user)
  - [Docker](#docker)
    - [Docker command](#docker-command)
    - [Docker compose](#docker-compose)
  - [Build from source](#build-from-source)
    - [Process](#requirements)
    - [Requirements](#process)
  - [Environment variables](#environment-variables)
- [📚 Documentation](#-documentation)
- [⚖️ License](#-license)
## 🚀 Installation
Recommended and the easiest way how to start to use of Spooty is using docker.

### Spotify App Configuration

To fully use Spooty, you need to create an application in the Spotify Developer Dashboard:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Sign in with your Spotify account
3. Create a new application
4. Note your `Client ID` and `Client Secret`
5. Configure the redirect URI to `http://127.0.0.1:3000/api/callback` (or the corresponding URL of your instance)

These credentials will be used by Spooty to access the Spotify API.

### Authentication & Default Admin User

Spooty includes a multi-user authentication system. Upon first start, a default admin user is automatically created.

**Default Credentials:**
- **Username:** `admin`
- **Password:** `admin`

> [!WARNING]
> **CHANGE THE DEFAULT PASSWORD IMMEDIATELY IN PRODUCTION!**
> 
> The default password is insecure and should only be used for initial setup and testing.

**Changing the Admin Password:**

1. **Using Environment Variables (Recommended for Docker):**
   ```shell
   docker run -d -p 3000:3000 \
     -e ADMIN_USERNAME=admin \
     -e ADMIN_PASSWORD='$apr1$newHash$...' \
     raiper34/spooty:latest
   ```
   
2. **Generate Password Hash:**
   - Use the included script: `node src/backend/generate-password.js yourpassword`
   - Or use online tool: [htpasswd generator](https://hostingcanada.org/htpasswd-generator/) (select MD5 Apache specific)

3. **After Login:**
   - Login with the default credentials
   - Navigate to the Admin panel (admin users only)
   - Create additional users or change your password
   - Each user gets their own download folder: `downloads/username/`

### Docker

Just run docker command or use docker compose configuration.
For detailed configuration, see available [environment variables](#environment-variables).

#### Docker command
```shell
docker run -d -p 3000:3000 \
  -v /path/to/downloads:/spooty/backend/downloads \
  -e SPOTIFY_CLIENT_ID=your_client_id \
  -e SPOTIFY_CLIENT_SECRET=your_client_secret \
  -e JWT_SECRET=your-random-secret-key \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD='$apr1$your$hash' \
  raiper34/spooty:latest
```
> **Note:** If `ADMIN_USERNAME` and `ADMIN_PASSWORD` are not set, the default credentials (admin/admin) will be used.

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
    environment:
      - SPOTIFY_CLIENT_ID=your_client_id
      - SPOTIFY_CLIENT_SECRET=your_client_secret
      - JWT_SECRET=your-random-secret-key
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=$apr1$your$hash
      # Configure other environment variables if needed
```
> **Note:** If `ADMIN_USERNAME` and `ADMIN_PASSWORD` are not set, the default credentials (admin/admin) will be used.

### Build from source

Spooty can be also build from source files on your own.

#### Requirements
- Node v20.20.0 (it is recommended to use `nvm` node version manager to install proper version of node)
- Redis in memory cache
- Ffmpeg
- Python3

#### Process
- install Node v20.20.0 using `nvm install` and use that node version `nvm use`
- from project root install all dependencies using `npm install`
- copy `.env.default` as `.env` in `src/backend` folder and modify desired environment properties (see [environment variables](#environment-variables))
- add your Spotify application credentials to the `.env` file:
  ```
  SPOTIFY_CLIENT_ID=your_client_id
  SPOTIFY_CLIENT_SECRET=your_client_secret
  ```
- build source files `npm run build`
    - built project will be stored in `dist` folder
- start server `npm run start`

### Environment variables

Some behaviour and settings of Spooty can be configured using environment variables and `.env` file.

 Name                 | Default                                     | Description                                                                                                                                   |
----------------------|---------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
 DB_PATH              | `./config/db.sqlite` (relative to backend)  | Path where Spooty database will be stored                                                                                                     |
 FE_PATH              | `../frontend/browser` (relative to backend) | Path to frontend part of application                                                                                                          |
 DOWNLOADS_PATH       | `./downloads` (relative to backend)         | Path where downaloded files will be stored                                                                                                    |
 FORMAT               | `mp3`                                       | Format of downloaded files ('aac', 'flac', 'mp3', 'm4a', 'opus', 'vorbis', 'wav', 'alac')                                                     |
 QUALITY              | undefined                                   | Audio quality (0-9 VBR or specific bitrate) of downloaded files                                                                               |
 PORT                 | 3000                                        | Port of Spooty server                                                                                                                         |
 REDIS_PORT           | 6379                                        | Port of Redis server                                                                                                                          |
 REDIS_HOST           | localhost                                   | Host of Redis server                                                                                                                          |
 RUN_REDIS            | false                                       | Whenever Redis server should be started from backend (recommended for Docker environment)                                                     |
 JWT_SECRET           | `spooty-secret-key-change-in-production`    | Secret key for JWT token signing (CHANGE IN PRODUCTION!)                                                                                     |
 ADMIN_USERNAME       | `admin`                                     | Username for the default admin user created on first start                                                                                    |
 ADMIN_PASSWORD       | `$apr1$uBmP/B6m$...` (hash for "admin")     | Password hash for admin user (Apache MD5 format). Generate with `node generate-password.js` or htpasswd generator                            |
 SPOTIFY_CLIENT_ID    | your_client_id                              | Client ID of your Spotify application (required)                                                                                              |
 SPOTIFY_CLIENT_SECRET| your_client_secret                          | Client Secret of your Spotify application (required)                                                                                          |
 YT_DOWNLOADS_PER_MINUTE | 3                                           | Set the maximum number of YouTube downloads started per minute                                                                                |
 YT_COOKIES           |                                             | Allows you to pass your YouTube cookies to bypass some download restrictions. See [below](#how-to-get-your-youtube-cookies) for instructions. |

### How to get your YouTube cookies (using browser dev tools):
1. Go to https://www.youtube.com and log in if needed.
2. Open the browser developer tools (F12 or right click > Inspect).
3. Go to the "Application" tab (in Chrome) or "Storage" (in Firefox).
4. In the left menu, find "Cookies" and select https://www.youtube.com.
5. Copy all the cookies (name=value) and join them with a semicolon and a space, like:
   VISITOR_INFO1_LIVE=xxxx; YSC=xxxx; SID=xxxx; ...
6. Paste this string into the YT_COOKIES environment variable (in your .env or Docker config).

## 📚 Documentation

- [Folder Structure Guide](docs/FOLDER_STRUCTURE_GUIDE.md) - Learn how to organize your music downloads by playlist or by artist/album structure

# ⚖️ License
[MIT](https://choosealicense.com/licenses/mit/)
