require('angular');

angular.module('liskApp').controller('voteController', ['txService', 'dposOffline', 'timestampService', "riseAPI", "$scope", "voteModal", "$http", "userService", "feeService", "$timeout", function (txService, dposOffline, timestampService, riseAPI, $scope, voteModal, $http, userService, feeService, $timeout) {

    $scope.sending = false;
    $scope.passmode = false;
    $scope.fromServer = '';
    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;
    $scope.secondPassphrase = userService.secondPassphrase;
    $scope.focus = 'secretPhrase';

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    $scope.passcheck = function (fromSecondPass) {
        $scope.fromServer=null;
        if (fromSecondPass) {
            $scope.checkSecondPass = false;
            $scope.passmode = $scope.rememberedPassphrase ? false : true;
            if ($scope.passmode) {
                $scope.focus = 'secretPhrase';
            }
            $scope.secondPhrase = '';
            $scope.secretPhrase = '';
            return;
        }
        if ($scope.rememberedPassphrase || userService.usingLedger) {
            $scope.vote($scope.rememberedPassphrase);
        } else {
            $scope.passmode = !$scope.passmode;
            if ($scope.passmode) {
                $scope.focus = 'secretPhrase';
            }
            $scope.secretPhrase = '';
        }
    }

    $scope.secondPassphrase = userService.secondPassphrase;

    $scope.close = function () {
        if ($scope.destroy) {
            $scope.destroy(true);
        }
        voteModal.deactivate();
    }

    $scope.removeVote = function (publicKey) {
        delete $scope.voteList[publicKey];
        delete $scope.pendingList[publicKey];
        if (!Object.size($scope.voteList)) {
            $scope.close();
        }
    }

    $scope.vote = function (pass, withSecond) {
        if ($scope.secondPassphrase && !withSecond) {
            $scope.checkSecondPass = true;
            $scope.focus = 'secondPhrase';
            return;
        }
        pass = pass || $scope.secretPhrase;

        var data = {
            secret: pass,
            delegates: Object.keys($scope.voteList).map(function (key) {
                return ($scope.adding ? '+' : '-') + key;
            }),
            publicKey: userService.publicKey
        };

        if ($scope.secondPassphrase) {
            data.secondSecret = $scope.secondPhrase;
            if ($scope.rememberedPassphrase) {
                data.secret = $scope.rememberedPassphrase;
            }
        }

        if (!$scope.sending) {
            $scope.sending = true;
            if (userService.usingLedger) {
                Materialize.toast('Check your Ledger', 3000, 'orange white-text');
            }
            txService
                .signAndBroadcast(
                    new dposOffline.transactions.VoteTx({
                        votes: data.delegates,
                    })
                        .set('fee', $scope.fees.vote)
                        .set('recipientId', userService.address)
                        .set('timestamp', timestampService()),
                    data.secret,
                    data.secondSecret
                )
                .then(function () {
                    $scope.sending = false;
                    if ($scope.destroy) {
                        $scope.destroy(true);
                    }
                    voteModal.deactivate();
                    Materialize.toast('Transaction sent', 3000, 'green white-text');
                })
                .catch(function (err) {
                    $scope.sending = false;
                    Materialize.toast('Transaction error', 3000, 'red white-text');
                    $scope.errorMessage.fromServer = err.message;
                })
                .then(function() { $scope.$apply(); })

        }
    }

    feeService(function (fees) {
        $scope.fee = fees.vote;
    });

}]);
