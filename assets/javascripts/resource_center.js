angular.module('resources', [])
    .controller('ResourcesCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.mediaType = '';
        $http.get('http://localhost:3000/resource_center/icn_resources').then(function(response) {
           $scope.resources = response.data;
        });
}]);