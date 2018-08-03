require('angular');

angular.module('liskApp').factory('ledgerConfirmAddressModal', function (btfModal) {
    return btfModal({
        controller: 'ledgerConfirmAddressModal',
        templateUrl: '/partials/modals/ledgerConfirmAddressModal.html'
    });
});
