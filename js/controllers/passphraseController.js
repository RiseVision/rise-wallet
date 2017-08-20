require('angular');

angular.module('liskApp').controller('passphraseController', ['dposOffline', 'riseAPI', '$scope', '$rootScope', '$http', "$state", "userService", "newUser", 'gettextCatalog', '$cookies',
  function (dposOffline, rise, $rootScope, $scope, $http, $state, userService, newUser, gettextCatalog, $cookies) {
    userService.setData();
    userService.rememberPassphrase = false;
    userService.rememberedPassphrase = '';
    $scope.rememberPassphrase = true;
    $scope.errorMessage = "";
	$scope.date = new Date();

    $scope.cleanUpUserData = function () {
        var userProperties = [ 'address', 'allVotes', 'balance', 'balanceToShow', 'dataToShow', 'unconfirmedBalance',
            'unconfirmedPassphrase', 'username', 'rememberedPassphrase', 'publicKey', 'delegate'];
        for (var i = 0; i < userProperties.length; i++) {
            if ($rootScope[userProperties[i]] != undefined) {
                $rootScope[userProperties[i]] = null;
            }
        }
    }
    $scope.cleanUpUserData();

    $scope.newUser = function () {
        $scope.newUserModal = newUser.activate({
            destroy: function () {
            }
        });
    }

    $scope.login = function (pass, remember) {
        if (!pass || pass.trim().split(/\s+/g).length < 12) {
            $scope.errorMessage = 'Passphrase must consist of 12 or more words.';
            return;
        }
        if (pass.length > 100) {
            $scope.errorMessage = 'Passphrase must contain less than 100 characters.';
            return;
        }
        if (!Mnemonic.isValid(pass)) {
            $scope.errorMessage = 'Passphrase must be a valid BIP39 mnemonic code.';
            return;
        }
        var data = { secret: pass };
        $scope.errorMessage = "";
        var wallet = new dposOffline.wallets.LiskLikeWallet(pass, 'R');

        rise.accounts.getAccount(wallet.address)
          .then(function (ac) {
            var account = ac.account;
            userService.setData(account.address, account.publicKey, account.balance, account.unconfirmedBalance, account.effectiveBalance);
            userService.setForging(account.forging);
            userService.setSecondPassphrase(account.secondSignature);
            if (remember) {
              userService.setSessionPassphrase(pass);
            }
            var goto = $cookies.get('goto');
            if (goto) {
              $state.go(goto);
            } else {
              $state.go('main.dashboard');
            }
          })
          .catch(function (err) {
            $scope.errorMessage = err.message? err.message : 'Error connecting to server';
          });
    }

    var passphrase = $cookies.get('passphrase');
    if (passphrase) {
        $scope.login(passphrase);
    }

}]);
