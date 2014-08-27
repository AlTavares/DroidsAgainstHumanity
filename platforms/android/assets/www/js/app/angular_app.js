'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngResource',
  'ngRoute',
  'ngSanitize',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'lobby.html', controller:'LobbyCtrl'});
    $routeProvider.when('/game/:gameId/pId/:playerId/name/:playerName', {templateUrl: 'game.html', controller: 'GameCtrl'});
    //$routeProvider.otherwise({redirectTo: '/'});
}]);