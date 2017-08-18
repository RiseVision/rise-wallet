var apiNode = 'localhost:5566';
var apiProto = 'http';
var express = require('express');
var httpProxy = require('http-proxy-middleware');
var wsProxy = httpProxy('ws://'+apiNode, {changeOrigin:true});

var app = express();
app.use(express.static('./'));

app.use(httpProxy({target: apiProto+'://'+apiNode, changeOrigin:true}));

// var proxy = httpProxy.createProxyServer({}); // See (†)
app.use(wsProxy);
// app.use(function (req,res,next) {
//   proxy.web(req, res, { target: 'https://twallet.rise.vision' });
// });

var server = app.listen(3000);
server.on('upgrade', wsProxy.upgrade);  // <-- subscribe to http 'upgrade'

