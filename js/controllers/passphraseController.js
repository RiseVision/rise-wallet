require('angular');

angular.module('liskApp').controller('passphraseController', ['ledgerNano', 'dposOffline', 'riseAPI', '$scope', '$rootScope', '$http', "$state", "userService", "newUser", 'gettextCatalog', '$cookies',
  function (ledgerNano, dposOffline, rise, $rootScope, $scope, $http, $state, userService, newUser, gettextCatalog, $cookies) {

    userService.setData();
    userService.rememberPassphrase = false;
    userService.rememberedPassphrase = '';
    $scope.rememberPassphrase = true;
    $scope.errorMessage = "";
    $scope.ledger = false;
    $scope.ledgerLoading = true;
	  $scope.date = new Date();
    ledgerNano.load
      .then(function (r) {
        $scope.ledger = r;
        $scope.ledgerLoading = false;
      });
    function walletLogin(wallet, remember) {
      rise.accounts.getAccount(wallet.address)
        .catch(function (ac) {
          if (ac.message === 'Account not found') {
            return {
              account: {
                address: wallet.address,
                publicKey: wallet.publicKey,
                balance: 0,
                unconfirmedBalance: 0,
                effectiveBalance: 0
              }
            }
          }
          return Promise.reject(ac);
        })
        .then(function (ac) {
          var account = ac.account;
          userService.setData(account.address, account.publicKey || wallet.publicKey, account.balance, account.unconfirmedBalance, account.effectiveBalance);
          userService.setForging(account.forging);
          userService.setSecondPassphrase(account.secondSignature);
          userService.secondPublicKey = account.secondPublicKey;
          if (remember && pass) {
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

    $scope.ledgerLogin = function () {
      ledgerNano.instance.getPubKey(ledgerNano.account, false)
        .then(function(res) {
          userService.usingLedger = true;
          $rootScope.usingLedger = true;
          walletLogin(res, false);
        })
    }

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
        userService.usingLedger = false;
        walletLogin(wallet, remember);

    }

    var passphrase = $cookies.get('passphrase');
    if (passphrase) {
        $scope.login(passphrase);
    }

}]);
