'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.

var host = "http://ncl-cah.herokuapp.com";

angular.module('myApp.services', [])
  .factory('GameService', function($http) {
        var s4 = function() {
            return Math.floor(Math.random() * 0x10000).toString();
        }
        var guid = function(){
            return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
        };
        var pId = guid();

        return {
            playerName: '',
            playerId : pId,
            newGameId : guid(),
            currentGameId: undefined,
            initName: function() {
                if(this.playerName.length === 0) {
                    this.playerName = 'anonymous ' + s4();
                }
            },
            getGames: function() {
                return $http.get(host + '/list');
            },
            createGame: function() {
                return $http.post(host + '/add', { id: guid(), name: this.playerName + (Math.floor(Math.random() * 9000) + 1000) });
            },
            joinGame: function(gameId, playerId, name) {
                return $http.post(host + "/joingame", { gameId: gameId, playerId: playerId, playerName: name });
            },
            departGame: function(gameId, playerId) {
                $http.post(host + '/departgame', { gameId: gameId, playerId: playerId});
            },
            selectCard: function(gameId, playerId, selectedCard){
                $http.post(host + "/selectCard", { gameId: gameId, playerId: playerId, whiteCardId: selectedCard });
            },
            selectWinner: function(gameId, selectedCard) {
                $http.post(host + "/selectWinner", { gameId: gameId, cardId: selectedCard });
            },
            readyForNextRound: function(gameId, playerId) {
                $http.post(host + "/readyForNextRound",  { playerId: playerId, gameId: gameId });
            }
        }
    });
