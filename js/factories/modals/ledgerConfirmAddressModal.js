require('angular');

angular.module('liskApp').factory('ledgerConfirmAddressModal', function (btfModal) {
    return btfModal({
        controller: 'ledgerConfirm',
        templateUrl: '/partials/modals/ledgerConfirmAddressModal.html'
    });
});
