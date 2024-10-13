# Build from source

Spooty can be also build from source files on your own. 

### Requirements
- Node v18.19.1 (it is recommended to use `nvm` node version manager to install proper version of node)

### Process
- install Node v18.19.1 using `nvm install` and use that node version `nvm use`
- from project root install all dependencies using `npm install`
- copy `.env.default` as `.env` in `src/backend` folder and modify desired environment properties (see list below)
- build source files `npm run build`
  - built project will be stored in `dist` folder 
- start server `npm run start`

### `.env` environment variables
some behaviour and settings of Spooty can be configured using environment variables and `.env` file.

Name | Default                                    | Description                                                                                                                                                   |
--- |--------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
DB_PATH | `./config/db.sqlite` (relative to backend) | Path where Spooty database will be stored                                                                                                                     |
FE_PATH | `../frontend/browser` (relative to backend)                     | Path to frontend part of application                                                                                                                          |
DOWNLOADS_PATH | `./downloads` (relative to backend)                             | Path where downaloded files will be stored                                                                                                                    |
FORMAT | `mp3`                                      | Format of downloaded files (currently fully supported only `mp3` but you can try whatever you want from [ffmpeg](https://ffmpeg.org/ffmpeg-formats.html#Muxers)) |
PORT | 3000                                       | Port of Spooty server                                                                                                                                         |