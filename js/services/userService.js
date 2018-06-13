require('angular');

angular.module('liskApp').service('userService', function () {

    this.rememberPassphrase = false;
    this.rememberedPassphrase = '';
    this.secondPublicKey = null;
    this.setData = function (address, publicKey, balance, unconfirmedBalance, effectiveBalance) {
        this.address = address;
        this.publicKey = publicKey;
        this.balance = balance / 100000000;
        this.unconfirmedBalance = unconfirmedBalance / 100000000;
        this.effectiveBalance = effectiveBalance / 100000000;
        this._balance = balance;
        this._unconfirmedBalance = unconfirmedBalance;
    }

    this.setSessionPassphrase = function (pass) {
        this.rememberPassphrase = true;
        this.rememberedPassphrase = pass;
    }

    this.setForging = function (forging) {
        this.forging = forging;
    }

    this.setMultisignature = function (multisignature,cb) {
        this.multisignature = multisignature;
        cb(multisignature);
    }

    this.setDelegate = function (delegate) {
        this.delegate = delegate;
    }

    this.setDelegateTime = function (transactions) {
        this.delegate.time = transactions[0].timestamp;
    }

    this.setDelegateProcess = function (delegate) {
        this.delegateInRegistration = delegate;
    }

    this.setSecondPassphrase = function (secondPassPhrase) {
        this.secondPassphrase = secondPassPhrase;
    }

    this.checkWallets = function(w1, w2) {
        if (w1.address != this.address) {
            throw new Error('Wrong passphrase');
        }
        if (this.secondPublicKey && !w2) {
          throw new Error('Missing second passphrase. Please reload wallet');
        } else if (this.secondPublicKey && w2.publicKey !== this.secondPublicKey) {
          throw new Error('Wrong second passphrase');
        }
    }

});
