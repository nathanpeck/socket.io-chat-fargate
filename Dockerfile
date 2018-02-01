FROM mhart/alpine-node:9 AS build
WORKDIR /srv
ADD package.json package.json
RUN npm install
ADD . .
EXPOSE 3000
CMD ["node", "index.js"]

FROM mhart/alpine-node:base-9
COPY --from=build /srv /srv
WORKDIR /srv
CMD ["node", "index.js"]
