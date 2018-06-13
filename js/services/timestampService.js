require('angular');

angular.module('liskApp').service('timestampService', function () {
    return function () {
        return Math.floor(((new Date()).getTime() - (new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0))).getTime())/1000) - 1;
    }
});
