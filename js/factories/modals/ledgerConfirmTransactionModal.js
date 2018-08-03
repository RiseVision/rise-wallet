require('angular');

angular.module('liskApp').factory('ledgerConfirmTransactionModal', function (btfModal) {
    return btfModal({
        controller: 'ledgerConfirm',
        templateUrl: '/partials/modals/ledgerConfirmTransactionModal.html'
    });
});
