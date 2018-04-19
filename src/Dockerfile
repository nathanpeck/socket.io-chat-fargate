FROM node:9 AS build
WORKDIR /srv
ADD package.json .
RUN npm install
ADD . .

FROM node:9-slim
COPY --from=build /srv .
EXPOSE 3000
CMD ["node", "index.js"]
