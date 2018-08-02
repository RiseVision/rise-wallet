require('angular');

angular.module('liskApp').service('ledgerNano', function (dposOffline) {
  var DposLedger       = require('dpos-ledger-api').DposLedger;
  var LedgerAccount    = require('dpos-ledger-api').LedgerAccount;
  var SupportedCoin    = require('dpos-ledger-api').SupportedCoin;
  var transportBrowser = require('@ledgerhq/hw-transport-u2f').default;

  var obj = {
    account        : new LedgerAccount().coinIndex(SupportedCoin.RISE).account(1),
    signTransaction: function (txObject) {
      console.log(obj.account);
      console.log(txObject);
      var bytes = txObject.getBytes();
      return obj.instance.signTX(this.account, bytes);
    },
    load: transportBrowser.create()
      .then(function (transport) {
        return new DposLedger(transport);
      })
      .then(function (instance) {
        obj.instance = instance;
        return instance.version();
      })
      .catch(function (err) {
        return false;
      })
      .then(function (version) {
        console.log(obj);
        return version.coinID === 'rise';
      })
  };

  return obj;
});
