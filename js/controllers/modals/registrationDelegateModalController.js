require('angular');

angular.module('liskApp').controller('registrationDelegateModalController', ['dposOffline', 'timestampService', 'riseAPI', "$scope", "registrationDelegateModal", "$http", "userService", "feeService", "delegateService", function (dposOffline, timestampService, riseAPI, $scope, registrationDelegateModal, $http, userService, feeService, delegateService) {

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

        if ($scope.rememberedPassphrase) {
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

            var wallet = new dposOffline.wallets.LiskLikeWallet(data.secret, 'R');
            var secondWallet = null;
            if (data.secondSecret) {
              secondWallet = new dposOffline.wallets.LiskLikeWallet(data.secondSecret, 'R');
            }
            try {
                userService.checkWallets(wallet, secondWallet);
            } catch (e) {
              $scope.sending = false;
              $scope.error = e.message;
              return;
            }
            var transaction = wallet.signTransaction(new dposOffline.transactions.DelegateTx({
                delegate: {
                    username: data.username
                }
              })
                .set('timestamp', timestampService())
                .set('fee', $scope.fees.delegate),
              secondWallet
            );
            riseAPI.transport({
                nethash: $scope.nethash,
                port: $scope.port,
                version: $scope.version
            })
            .postTransaction(transaction)
            .then(function () {
              $scope.sending = false;
              userService.setDelegateProcess(true);
              $scope.destroy();
              Materialize.toast('Transaction sent', 3000, 'green white-text');
              registrationDelegateModal.deactivate();
            })
              .catch(function (err) {
                $scope.sending = false;
                userService.setDelegateProcess(false);
                Materialize.toast('Transaction error', 3000, 'red white-text');
                $scope.error = err.message;
              });

        }
    }

    feeService(function (fees) {
        $scope.fee = fees.delegate;
    });

}]);
