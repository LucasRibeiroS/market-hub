FROM node:20-bullseye-slim

# install chorme to puppeteer lib
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=false

# copy package.json
COPY package.json package.json

# create dir ng-app
RUN mkdir /wikibank-api

# change dir
WORKDIR /wikibank-api

# copy all files to dir
COPY . .

RUN npm install underscore@1.13.4
RUN npm install --ignore-engines --production
RUN npm install modclean --save

# add env path to machine
ENV PATH="${PATH}:/wikibank-api/node_modules/.bin"

RUN modclean -n default:safe

RUN rm -rf ./node_modules/rxjs/src/
RUN rm -rf ./node_modules/rxjs/bundles/
RUN rm -rf ./node_modules/rxjs/_esm5/
RUN rm -rf ./node_modules/rxjs/_esm2015/
RUN rm -rf ./node_modules/grpc/deps/grpc/third_party/
RUN rm -rf ./node_modules/aws-sdk/dist/

RUN npm run build:prod

# remove old src dir
RUN rm -rf ./src

EXPOSE 3007

ENTRYPOINT sh /wikibank-api/docker-app/init.sh
