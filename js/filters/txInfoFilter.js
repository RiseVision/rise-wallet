require('angular');

angular.module('liskApp').filter('txInfoFilter', function () {
    return function (tx) {
        if (tx.type === 3) {
            var added = tx.asset.votes.filter(function(v) {return v.startsWith('+');}).length;
            var removed = tx.asset.votes.length - added;
            return added+ ' added votes, '+removed+' removed';
        }
    }
});
