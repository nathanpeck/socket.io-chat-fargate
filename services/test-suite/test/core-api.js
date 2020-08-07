var request = require("request-promise-native");
var expect = require("chai").expect;
var socketClient = require("socket.io-client");
var config = require("./config");

var client = request.defaults({
  baseUrl: config.SELF_URL,
  resolveWithFullResponse: true,
});

describe("The application server", function () {
  it("should serve webpages over HTTP", async function () {
    var result = await client.get("index.html");
    expect(result.statusCode).to.equal(200);
  });

  it("should have a socket.io server", async function () {
    var socket = socketClient(config.SELF_URL);

    await new Promise(function (resolve) {
      socket.on("connect", resolve);
    });

    socket.disconnect();
  });
});
