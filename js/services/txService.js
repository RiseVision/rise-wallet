require('angular');

angular.module('liskApp').service('txService', function (riseAPI, dposOffline, ledgerNano, userService, timestampService) {
  function _signTransaction(tx, secret, secondSecret) {
    if (userService.usingLedger) {
      tx.senderPublicKey = userService.publicKey;
      return ledgerNano.instance
        .signTX(
          ledgerNano.account,
          tx.getBytes()
        )
        .then(function (signature) {
          tx._signature = signature.toString('hex');
          var transaction = tx.toObj();
          transaction.senderId = userService.address;
          return transaction;
        })
    } else {
      var wallet = new dposOffline.wallets.LiskLikeWallet(secret, 'R');
      var secondWallet = null;
      if (data.secondSecret) {
        secondWallet = new dposOffline.wallets.LiskLikeWallet(secondSecret, 'R');
      }
      userService.checkWallets(wallet,secondWallet);
      var signedTx = wallet.signTransaction(tx, secondWallet);
      return Promise.resolve(signedTx);
    }

  }

  function _broadcastSignedTX(tx) {
    return riseAPI
      .buildTransport()
      .then(function (transport) {
        console.log('transport', transport);
        return transport.postTransaction(tx)
      });
  }

  return {
    signAndBroadcast: function(tx, secret, secondSecret) {
      try {
        return _signTransaction(tx, secret, secondSecret)
          .then(_broadcastSignedTX)
      } catch (err) {
        console.log(err);
        return Promise.reject(err);
      }
    }
  }
});
