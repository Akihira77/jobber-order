FROM node:20.15.0-alpine as builder

# stage 1
# npm install
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY .npmrc ./
COPY usage.txt ./usage.txt
COPY src ./src
RUN npm install -g npm@latest
RUN npm ci && npm run build

# stage 2
# npm run build/test
FROM node:20.15.0-alpine

WORKDIR /app
# with alpine we can install curl with apk command
RUN apk add --no-cache curl
COPY package*.json ./
COPY tsconfig.json ./
COPY .npmrc ./
RUN npm install -g pm2

RUN npm ci --production
COPY --from=builder /app/build ./build

EXPOSE 4006

CMD [ "npm", "run", "start:pm" ]

# stage 3
# npm ci/build

# stage 4
