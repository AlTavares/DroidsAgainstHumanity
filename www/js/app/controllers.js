'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
    .controller('HomeCtrl', function($scope, $location, GameService) {
        console.log('HomeCtrl loaded');    

        var handleError = function(err) {
            console.error(err);
        };

        $scope.gameSvc = GameService;
        $scope.inLobby = true;

        $scope.createGame = function() {
            console.log('createGame called');
            GameService.initName();
            GameService.createGame()
                .then(function(success) {
                    //navigate to the new game
                    $scope.joinGame(success.data.name);
                }, handleError);
        };

        function getGameId(gameName){
            var gameId = null;
            $.ajaxSetup({
                async: false
            });
            $.getJSON("http://ncl-cah.herokuapp.com/list", function(data){
                for (var i = data.length - 1; i >= 0; i--) {
                    if (data[i].name == gameName){ 
                        gameId = data[i].id;
                        return false;
                    };
                };
            });
            $.ajaxSetup({
                async: true
            });
            return gameId;
        }

        $scope.joinGame = function(gameName) {
            var gameId = getGameId(gameName);
            console.log('joinGame called for gameId ' + gameId);
            GameService.initName();
            $location.url("/game/"+ gameId + "/pId/" + GameService.playerId + "/name/" + GameService.playerName);
            $( document ).ready(function() {
                $(".navbar").hide();
                $("body").css("padding","0");
            });
            
        };

        $scope.$on('enterLobby', function() {
            $scope.inLobby = true;
        });

        $scope.$on('enterGame', function() {
            $scope.inLobby = false;
        })

    })
    .controller('GameCtrl', function($scope, $routeParams, GameService){
        console.log('GameCtrl loaded');

        var socket;

        $scope.game = {};
        $scope.currentPlayer = {};
        $scope.progStyle = {width: '0%'};
        $scope.progStyleValue = 0;
        $scope.gameId = $routeParams.gameId;
        $scope.playerId = $routeParams.playerId;
        $scope.gameError;

        GameService.playerName = $routeParams.playerName;

        //ng-show helper functions
        $scope.showNotificationSelectCard = function() {
            return !$scope.currentPlayer.isCzar &&
                !$scope.currentPlayer.selectedWhiteCardId &&
                $scope.game.isStarted &&
                !$scope.game.isReadyForScoring
        };

        $scope.showNotificationWaitingOnCzar = function() {
            return !$scope.currentPlayer.isCzar &&
                $scope.game.isReadyForScoring &&
                !$scope.game.isReadyForReview
        };

        $scope.showNotificationWaitingOnCards = function() {
            return ($scope.currentPlayer.isCzar || $scope.currentPlayer.selectedWhiteCardId) &&
                !$scope.game.isReadyForScoring
        };

        $scope.showNotificationSelectWinner = function() {
            return $scope.currentPlayer.isCzar &&
                $scope.game.isReadyForScoring &&
                !$scope.game.isReadyForReview
        };

        $scope.showWhiteCardList = function() {
            return !$scope.currentPlayer.isCzar && $scope.game.isStarted && !$scope.game.isReadyForScoring
        };

        $scope.showSelectedWhiteCardList = function() {
            return ($scope.currentPlayer.isCzar && $scope.game.isStarted && $scope.game.isReadyForScoring) ||
                $scope.game.isReadyForReview
        };
        //end ng-show helper functions

        $scope.buildWinningText = function(history) {
            var text = history.black;

            if(text.indexOf("__________") != -1) {
                text = text.replace("__________", "<b>" + history.white + "</b>");
            } else {
                text = text + " <b>" + history.white + "</b>"
            }
            return text
        };

        $scope.whiteCardNonNull = function(item) {
            return item.selectedWhiteCardId != undefined;
        }

        $scope.getPlayerStatus = function(player) {
            var status ='';
            if(!$scope.game.isStarted) {
                status = "waiting";
            }
            else if(!$scope.game.isReadyForReview && !$scope.game.isReadyForScoring) {
                if(player.isCzar) {
                    status = "card czar";
                } else if(!player.selectedWhiteCardId) {
                    status = "selecting card";
                } else if(player.selectedWhiteCardId) {
                    status = "card selected";
                }
            }
            else if($scope.game.isReadyForReview) {
                if(player.isReady) {
                    status = "ready for next round";
                } else {
                    status = "reviewing results";
                }
            }
            else if($scope.game.isReadyForScoring) {
                if(player.isCzar) {
                    status = "selecting winner";
                } else {
                    status = "card selected"
                }
            }
            if($scope.game.isOver) {
                status = player.awesomePoints == $scope.game.pointsToWin ? "WINNER!" : "loser :(";
            }

            return status;
        }

        $scope.selectCard = function(card) {
            GameService.selectCard($scope.gameId, $scope.playerId, card);
        };

        $scope.getButtonClass = function(card) {
            if(card === $scope.currentPlayer.selectedWhiteCardId) {
                return 'btn btn-primary'
            } else {
                return 'btn btn-default'
            }
        };

        $scope.getButtonText = function(card) {
            if(card === $scope.currentPlayer.selectedWhiteCardId) {
                return 'selected'
            } else {
                return 'select'
            }
        };

        $scope.selectWinner = function(card) {
            GameService.selectWinner($scope.gameId, card);
        };

        $scope.getWinningCardClass = function(card) {
            if(card === $scope.game.winningCardId){
                return 'alert alert-success'
            } else {
                return 'alert alert-info'
            }
        };

        $scope.readyForNextRound = function() {
            GameService.readyForNextRound($scope.gameId, $scope.playerId);
        };

        function setProgStyle() {
            if($scope.game){
                var playersWaiting = _.reduce($scope.game.players, function(total, player) {
                    if(player.selectedWhiteCardId){return total + 1}
                    else{ return total}
                }, 0);
                //this extra addition brings the progress bar to 100% when the game is ready for review
                if($scope.game.isReadyForReview){
                    playersWaiting += 1;
                }
                $scope.progStyleValue = ((playersWaiting / $scope.game.players.length) * 100);
                $scope.progStyle = {width: $scope.progStyleValue + '%'};
            }
        };

        function renderGame(game) {
            $scope.game = game;
            $scope.currentPlayer = _.find(game.players, function(p) {
                return p.id === $scope.playerId;
            });
            visualHack();
            setProgStyle();
        };

        function initSocket() {
            socket = io.connect("http://ncl-cah.herokuapp.com/", {query: 'playerId=' + $routeParams.playerId});
            if(socket.socket.connected){
                socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
            }
            socket.on('connect', function() {
                console.log('game socket connect');
                socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
            });

            socket.on('updateGame', function(game) {
                console.log('updateGame');
                console.log(game);
                renderGame(game);
                $scope.$apply();
            });

            socket.on('gameError', function(errorMsg) {
                $scope.gameError = errorMsg;
                $scope.$apply();
            });
        }

        function visualHack(){
            var mySwiper = $('.swiper-container').swiper({
                //Your options here:
                mode:'horizontal',
                grabCursor: true
                //etc..
            });
                $(".heightHack").css("height","100%");
        }

        function joinGame() {
            GameService.joinGame($routeParams.gameId, $routeParams.playerId, $routeParams.playerName)
                .then(function(success) {
                    renderGame(success.data);
                    initSocket();
                },
              function(error) {
                $scope.gameError = error.data.error;
              });
        };

        joinGame();
        //initSocket();
        $scope.$emit('enterGame');

        $scope.$on('$destroy', function(event) {
            console.log('leaving GameCtrl');
            if($scope.game){
                GameService.departGame($scope.game.id, $scope.playerId);
            }
        });
    })
    .controller('LobbyCtrl', function($scope, $location, GameService) {
        console.log('LobbyCtrl loaded');
        var socket;

        $("body").css("padding-top","60px");
        $(".navbar").show();


        $scope.availableGames = [];
        $scope.creatingGame = false;
        $scope.gameSvc = GameService;

        $scope.getGames = function() {
            GameService.getGames()
                .then(function(success) {
                    var games = success.data;
                    console.log('getGames returned ' + games.length + ' items');
                    $scope.availableGames = games;
            });
        };

        function initSocket() {
            socket = io.connect('http://ncl-cah.herokuapp.com/lobby');
            console.log("initSocket");
            if(socket.socket.connected){
                $scope.getGames();
            }
            socket.on('connect', function() {
                console.log('lobby socket connect');
            });

            socket.on('lobbyJoin', function(gameList) {
                console.log('lobbySocket: lobbyJoin');
                $scope.availableGames = gameList;
                $scope.$apply();
            });

            socket.on('gameAdded', function(gameList) {
                console.log('gameAdded');
                console.log(gameList);
                $scope.availableGames = gameList;
                $scope.$apply();
            });
        }
        initSocket();
        $scope.$emit('enterLobby');
    });