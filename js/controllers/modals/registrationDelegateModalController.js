require('angular');

angular.module('liskApp').controller('registrationDelegateModalController',
  ['txService', 'dposOffline', 'timestampService', 'riseAPI', "$scope", "registrationDelegateModal", "$http", "userService", "feeService", "delegateService",
  function (txService, dposOffline, timestampService, riseAPI, $scope, registrationDelegateModal, $http, userService, feeService, delegateService) {

    $scope.error = null;
    $scope.sending = false;
    $scope.passmode = false;
    $scope.delegate = userService.delegate;
    $scope.isSecondPassphrase = userService.secondPassphrase;
    $scope.delegateData = {username: ''};
    $scope.secondPassphrase = userService.secondPassphrase;
    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;
    $scope.focus = 'username';

    $scope.close = function () {
        if ($scope.destroy) {
            $scope.destroy();
        }

        registrationDelegateModal.deactivate();
    }

    function validateUsername (onValid) {
        var isAddress = /^[0-9]+[R|r]$/g;
        var allowSymbols = /^[a-z0-9!@$&_.]+$/g;

        $scope.delegateData.username = $scope.delegateData.username.trim();

        if ($scope.delegateData.username == "") {
            $scope.error = "Empty username";
        } else if ($scope.delegateData.username.length > 20) {
            $scope.error = "Username is too long. Maximum is 20 characters";
        } else {
            if (!isAddress.test($scope.delegateData.username)) {
                if (allowSymbols.test($scope.delegateData.username.toLowerCase())) {
                    return onValid();
                } else {
                    $scope.error = "Username can only contain alphanumeric characters with the exception of !@$&_.";
                }
            } else {
                $scope.error = "Username cannot be a potential address";
            }
        }
    }

    $scope.passcheck = function (fromSecondPass) {
        $scope.error = null;
        if (fromSecondPass) {
            $scope.checkSecondPass = false;
            $scope.passmode = $scope.rememberedPassphrase ? false : true;
            $scope.secondPhrase = '';
            $scope.pass = '';
            if ($scope.passmode) {
                $scope.focus = 'secretPhrase';
            } else {
                $scope.focus = 'username';
            }
            return;
        }

        if ($scope.rememberedPassphrase || userService.usingLedger) {
            validateUsername(function () {
                $scope.error = null;
                $scope.registrationDelegate($scope.rememberedPassphrase);
            });
        } else {
            validateUsername(function () {
                $scope.error = null;
                $scope.focus = 'secretPhrase';
                $scope.passmode = !$scope.passmode;
                $scope.pass = '';
            });
        }
    }

    $scope.registrationDelegate = function (pass, withSecond) {
        if ($scope.secondPassphrase && !withSecond) {
            $scope.focus = 'secondPhrase';
            $scope.checkSecondPass = true;
            return;
        }

        pass = pass || $scope.secretPhrase;

        $scope.error = null;

        var data = {
            secret: pass,
            secondSecret: $scope.secondPhrase,
            publicKey: userService.publicKey
        };

        if ($scope.delegateData.username.trim() != '') {
            data.username = $scope.delegateData.username.trim()
        }

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
                    new dposOffline.transactions.DelegateTx({
                        delegate: {
                            username: data.username,
                            publicKey: userService.publicKey, // TODO: to be removed
                        }
                    })
                        .set('timestamp', timestampService())
                        .set('fee', $scope.fees.delegate),
                    data.secret,
                    data.secondSecret
                )
                .then(function () {
                    $scope.sending = false;
                    $scope.destroy();
                    userService.setDelegateProcess(true);
                    Materialize.toast('Transaction sent', 3000, 'green white-text');
                    registrationDelegateModal.deactivate();

                })
                .catch(function (err) {
                    $scope.sending = false;
                    userService.setDelegateProcess(false);
                    Materialize.toast('Transaction error', 3000, 'red white-text');
                    $scope.error = err.message;
                })
                .then(function() { $scope.$apply() });

        }
    }

    feeService(function (fees) {
        $scope.fee = fees.delegate;
    });

}]);
