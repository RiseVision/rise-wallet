require('angular');
var dposOffline  = require('dpos-offline').dposOffline;
angular.module('liskApp').service('dposOffline', function () {
  return dposOffline;
});
