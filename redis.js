var redis = require('redis');
var config = require('./config.js');
//load configurations
var client = redis.createClient(config.redis.port, config.redis.host, config.redis.options);

client.on("error", function (err) {
  console.log("Can not connect to redis:", err);
  // TODO: comment this?
  throw new Error('Can not connect to redis.' + err);
});
