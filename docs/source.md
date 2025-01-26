# Build from source

Spooty can be also build from source files on your own. 

### Requirements
- Node v18.19.1 (it is recommended to use `nvm` node version manager to install proper version of node)
- Redis in memory cache 

### Process
- install Node v18.19.1 using `nvm install` and use that node version `nvm use`
- from project root install all dependencies using `npm install`
- copy `.env.default` as `.env` in `src/backend` folder and modify desired environment properties (see [Environment variables](variables.md))
- build source files `npm run build`
  - built project will be stored in `dist` folder 
- start server `npm run start`