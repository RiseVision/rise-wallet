var https = require('https');
var fs = require('fs');
var apiNode = 'twallet.rise.vision';
var apiProto = 'https';
var express = require('express');
var httpProxy = require('http-proxy-middleware');
var wsProxy = httpProxy('ws://'+apiNode, {changeOrigin:true});

var app = express();
app.use(express.static('./'));

app.use(httpProxy({ssl: {cert: 'cert.pem', key: 'key.pem'}, secure: true, target: apiProto+'://'+apiNode, changeOrigin:true}));

// var proxy = httpProxy.createProxyServer({}); // See (†)
app.use(wsProxy);
// app.use(function (req,res,next) {
//   proxy.web(req, res, { target: 'https://twallet.rise.vision' });
// });

var s = https.createServer({
  cert: fs.readFileSync('./cert.pem'),
  key: fs.readFileSync('./key.pem'),
}, app);
var server = s.listen(3000);
server.on('upgrade', wsProxy.upgrade);  // <-- subscribe to http 'upgrade'

