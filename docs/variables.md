# Environment variables

some behaviour and settings of Spooty can be configured using environment variables and `.env` file.

Name | Default                                     | Description                                                                                                                                                      |
--- |---------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
DB_PATH | `./config/db.sqlite` (relative to backend)  | Path where Spooty database will be stored                                                                                                                        |
FE_PATH | `../frontend/browser` (relative to backend) | Path to frontend part of application                                                                                                                             |
DOWNLOADS_PATH | `./downloads` (relative to backend)         | Path where downaloded files will be stored                                                                                                                       |
FORMAT | `mp3`                                       | Format of downloaded files (currently fully supported only `mp3` but you can try whatever you want from [ffmpeg](https://ffmpeg.org/ffmpeg-formats.html#Muxers)) |
PORT | 3000                                        | Port of Spooty server                                                                                                                                            |
REDIS_PORT | 6379                                        | Port of Redis server                                                                                                                                             |
REDIS_HOST | localhost                                        | Host of Redis server                                                                                                                                             |
RUN_REDIS | true                                        | Whenever Redis server should be started from backend (recommended for Docker environment)                                                                        |