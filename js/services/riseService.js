require('angular');
var riseJs  = require('risejs').rise;
angular.module('liskApp').service('riseAPI', function () {
  riseJs.nodeAddress = 'http://localhost:5566';

  return riseJs;

});
