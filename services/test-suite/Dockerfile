FROM node:18 AS build
WORKDIR /srv
ADD package.json .
RUN npm install

FROM node:18-slim
COPY --from=build /srv .
ADD . .
EXPOSE 3000
CMD ["node", "./node_modules/.bin/mocha", "-b", "--exit"]
