FROM node:18

WORKDIR /spooty

COPY . .

RUN apt-get -y update && apt-get -y upgrade && apt-get install -y --no-install-recommends ffmpeg

RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]