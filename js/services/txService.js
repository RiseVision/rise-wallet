require('angular');

angular.module('liskApp').service('txService',
  function (riseAPI, dposOffline, ledgerNano, userService, ledgerConfirmTransactionModal) {
  function _signTransaction(tx, secret, secondSecret) {
    if (userService.usingLedger) {
      tx.senderPublicKey = userService.publicKey;
      ledgerConfirmTransactionModal.activate({
        transaction: tx,
        address: userService.address,
      });
      return ledgerNano.instance
        .signTX(
          ledgerNano.account,
          tx.getBytes()
        )
        .then(function (signature) {
          ledgerConfirmTransactionModal.deactivate();
          tx._signature = signature.toString('hex');
          var transaction = tx.toObj();
          transaction.senderId = userService.address;
          return transaction;
        })
        .catch(function (err) {
          ledgerConfirmTransactionModal.deactivate();
          return Promise.reject(err);
        });
    } else {
      var wallet = new dposOffline.wallets.LiskLikeWallet(secret, 'R');
      var secondWallet = null;
      if (secondSecret) {
        secondWallet = new dposOffline.wallets.LiskLikeWallet(secondSecret, 'R');
      }
      userService.checkWallets(wallet, secondWallet);
      var signedTx = wallet.signTransaction(tx, secondWallet);
      return Promise.resolve(signedTx);
    }

  }

  function _broadcastSignedTX(tx) {
    return riseAPI
      .transactions
      .put(tx);
  }

  return {
    signAndBroadcast: function(tx, secret, secondSecret) {
      try {
        return _signTransaction(tx, secret, secondSecret)
          .then(_broadcastSignedTX)
          .then(function(r) {
            if (r.invalid.length === 1) {
              return Promise.reject(new Error(r.invalid[0].reason));
            }
            return r;
          })
      } catch (err) {
        console.log(err);
        return Promise.reject(err);
      }
    }
  }
});
