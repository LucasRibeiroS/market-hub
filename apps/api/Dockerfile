FROM node:20-bullseye-slim

# copy package.json
COPY package.json package.json

# create dir ng-app
RUN mkdir /integrator-api

# change dir
WORKDIR /integrator-api

# copy all files to dir
COPY . .


# add env path to machine
ENV PATH="${PATH}:/integrator-api/node_modules/.bin"

RUN npm install --ignore-engines --production
RUN npm install modclean --save

RUN modclean -n default:safe

RUN npm run build

# remove old src dir
RUN rm -rf ./src
RUN rm drizzle.config.ts
RUN rm eslint.config.mjs
# remove unused ts database files
RUN rm -rf ./database/*.ts

EXPOSE 3000

ENTRYPOINT ["sh", "-c", "yarn db:migrate --config=dist/drizzle.config.js && node --expose_gc --experimental-worker --experimental-modules dist/src/servers/index.js"]