require('angular');

angular.module('liskApp').controller('secondPassphraseModalController', ['riseAPI', "$scope", "secondPassphraseModal", "$http", "userService", "feeService", function (riseAPI, $scope, secondPassphraseModal, $http, userService, feeService) {

    $scope.sending = false;
    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;
    $scope.passmode = false;
    $scope.focus = 'secondPass';
    $scope.step = 1;

    $scope.goToStep = function (step) {
        $scope.passmode = false;
        $scope.repeatPassphrase = '';
        $scope.noMatch = false;
        $scope.step = step;
    }

    $scope.close = function () {
        if ($scope.destroy) {
            $scope.destroy();
        }
        secondPassphraseModal.deactivate();
    }

    $scope.generatePassphrase = function () {
        var code = new Mnemonic(Mnemonic.Words.ENGLISH);
        $scope.newPassphrase = code.toString();
    };

    $scope.generatePassphrase();

    $scope.savePassToFile = function (pass) {
        var blob = new Blob([pass], { type: "text/plain;charset=utf-8" });
        FS.saveAs(blob, "RiseSecondPassphrase.txt");
    }

    $scope.confirmNewPassphrase = function () {
        if (!Mnemonic.isValid($scope.repeatPassphrase) || ($scope.repeatPassphrase != $scope.newPassphrase)) {
            $scope.noMatch = true;
            return;
        } else {
            $scope.noMatch = false;
            $scope.passcheck();
        }
    }

    $scope.passcheck = function () {
        if ($scope.rememberedPassphrase) {
            $scope.addNewPassphrase($scope.rememberedPassphrase);
        } else {
            $scope.passmode = !$scope.passmode;
            if ($scope.passmode) {
                $scope.focus = 'pass';
            } else {
                $scope.focus = 'secondPass';
            }
            $scope.fromServer = '';
            $scope.pass = '';
        }
    }

    $scope.addNewPassphrase = function (pass) {
        if (!$scope.sending) {
            $scope.sending = true;
            var shiftjs = require('shift-js');
            var signature = shiftjs.signature.createSignature(pass, $scope.newPassphrase);
            signature.fee = $scope.fees.secondsignature;
            riseAPI.transport({
                nethash: $scope.nethash,
                port: $scope.port,
                version: $scope.version
            })
            .postTransaction(signature)
            .then(function () {
              $scope.sending = false;
              if ($scope.destroy) {
                $scope.destroy(true);
              }
              Materialize.toast('Transaction sent', 3000, 'green white-text');
              secondPassphraseModal.deactivate();
            })
            .catch(function(err) {
              $scope.sending = false;
              Materialize.toast('Transaction error', 3000, 'red white-text');
              $scope.errorMessage.fromServer = err.message;
            });
        }
    }

    feeService(function (fees) {
        $scope.fee = fees.secondsignature;
    });

}]);
