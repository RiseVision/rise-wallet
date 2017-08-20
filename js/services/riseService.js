require('angular');
var riseJs  = require('risejs').rise;
angular.module('liskApp').service('riseAPI', function () {

  return riseJs;

});
