const Koa = require('koa');
const https = require('https');

const router = require('./middle/router');
const compress = require('./middle/compress');
const util = require('./lib/util');
const fs = require('licia/fs');
const WebSocketServer = require('./lib/WebSocketServer');

async function start({ port = 8080, host, domain, server, cdn, https: useHttps, sslCert, sslKey } = {}) {
  domain = domain || 'localhost:' + port;

  const app = new Koa();
  const wss = new WebSocketServer();

  app.use(compress()).use(router(wss.channelManager, domain, cdn));

  if (server) {
    server.on('request', app.callback());
    wss.start(server);
  } else {
    util.log(`starting server at ${domain}`);
    if (useHttps) {
      const cert = await fs.readFile(sslCert, 'utf8');
      const key = await fs.readFile(sslKey, 'utf8');
      const server = https
        .createServer(
          {
            key,
            cert,
          },
          app.callback()
        )
        .listen(port, host);
      wss.start(server);
    } else {
      const server = app.listen(port, host);
      wss.start(server);
    }
  }
}

module.exports = {
  start,
};
