require('angular');

angular.module('liskApp').controller('multisignatureModalController', ['riseAPI', 'dposOffline', "$scope", "$http", "multisignatureModal", "viewFactory", "userService", "feeService", "gettextCatalog", function (riseAPI, dposOffline, $scope, $http, multisignatureModal, viewFactory, userService, feeService, gettextCatalog) {

    $scope.sending = false;
    $scope.view = viewFactory;
    $scope.view.loadingText = gettextCatalog.getString('Configuring multi-signature group');
    $scope.secondPassphrase = userService.secondPassphrase;
    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;
    $scope.authData = {
        password: $scope.rememberedPassphrase || '',
        secondPassphrase: ''
    }
    $scope.addingError = '';
    $scope.currentAddress = userService.address;

    $scope.close = function () {
        if ($scope.destroy) {
            $scope.destroy(false);
        }
        multisignatureModal.deactivate();
    }

    $scope.step = 1;
    $scope.totalCount = 0;
    $scope.sign = 2;

    $scope.goToStep3 = function () {
        $scope.addingError = '';
        if ($scope.totalCount) {
            $scope.step = 3;
        } else {
            $scope.addingError = 'Please add at least one additional member to create a multi-signature group';
        }
    }

    $scope.members = {};

    $scope.deleteMember = function (publicKey) {
        delete $scope.members[publicKey];
        $scope.totalCount = $scope.totalCount - 1;
    }

    $scope.addMember = function (member) {
        $scope.addingError = '';
        var isAddress = /^[0-9]+[R|r]$/g;
        var correctAddress = isAddress.test(member);
        if ($scope.member.trim() == '') {
            $scope.addingError = 'Empty address';
        } else {
            var Buffer = require('buffer/').Buffer;
            var buffer =  []
            try {
                buffer = Buffer(member, "hex")}
            catch(err) {

            }
            if (buffer.length == 32) {
                var lisk = require('shift-js');
                var address = lisk.crypto.getAddress($scope.member);
                if ($scope.members[$scope.address] || address == userService.address) {
                    return;
                }
                $scope.members[$scope.member] = {address: address, publicKey: $scope.member};
                $scope.totalCount = $scope.totalCount + 1;
                $scope.member = '';
            } else {
                if (correctAddress) {
                    $http.get("/api/accounts?address=" + member).then(function (response) {
                        if (response.data.success) {
                            $scope.presendError = false;
                            $scope.addingError = '';
                            if ($scope.members[response.data.account.publicKey] || member == userService.address) {
                                return;
                            }
                            $scope.members[response.data.account.publicKey] = response.data.account;
                            $scope.totalCount = $scope.totalCount + 1;
                            $scope.member = '';
                        } else {
                            $scope.addingError = response.data.error;
                        }
                    });
                } else {
                    $scope.addingError = 'Incorrect address';
                }
            }
        }
    }

    $scope.putMembers = function (fromPass) {
        $scope.errorMessage = '';
        if (fromPass) {
            if ($scope.authData.password.trim() == '') {
                $scope.errorMessage = "Empty passphrase";
                return;
            } else if ($scope.authData.secondPassphrase.trim() == '' && $scope.secondPassphrase) {
                $scope.errorMessage = "Empty second passphrase";
                return;
            }
        } else {
            if ($scope.secondPassphrase || !$scope.rememberedPassphrase) {
                $scope.step = 4;
                return;
            }
        }

        var data = {
            secret: $scope.authData.password,
            publicKey: userService.publicKey,
            min: $scope.sign,
            lifetime: 24,
            keysgroup: Object.keys($scope.members).map(function (element) {
                return '+' + element;
            })
        };

        if ($scope.secondPassphrase) {
            data.secondSecret = $scope.authData.secondPassphrase;
        }

        if (!$scope.sending) {
            $scope.sending = true;
            var shiftjs = require('shift-js');
            var multisig = shiftjs.signature.createMultisignature(data.secret, data.secondSecret, data.keysgroup, data.lifetime, data.min);
            multisig.fee = $scope.fees.multisignature;
            riseAPI.transport({
              nethash: $scope.nethash,
              port: $scope.port,
              version: $scope.version
            })
              .postTransaction(multisig)
              .then(function (response) {
                $scope.sending = false;
                if ($scope.destroy) {
                  $scope.destroy(true);
                }
                Materialize.toast('Transaction sent', 3000, 'green white-text');
                multisignatureModal.deactivate();
              })
              .catch(function (e) {
                Materialize.toast('Transaction error', 3000, 'red white-text');
                $scope.errorMessage = e.message;
              });
        }
    }

    feeService(function (fees) {
        $scope.fee = fees.multisignature;
    });

}]);
