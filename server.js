// simpleExpressServer.js

var fs = require("fs");
var path = require("path");
var express = require("express");
var flash = require("connect-flash");

var passport = require('passport');
var PassportLocalStrategy = require('passport-local').Strategy;

//======================================
//      init/main
//======================================

var app = express();

app.configure(function(){
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({ secret: 'By90asdbAB0' }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.use(app.router);
});

function serveStaticFile(request, response) {
   /* //notify the user they're logged in. Necessary because
    //  we use the same html for logging in and when they're
    //  logged in
    if (request.user !== undefined){
        response.cookie("user", request.user.sessionId);
        response.cookie("name", request.user.username);
    }
    else {
        response.cookie("user", "none");
        response.cookie("name", "none");
    }
    console.log("user:", request.user);*/
    response.sendfile("static/" + request.params.staticFilename);
}

app.get("/static/:staticFilename", serveStaticFile);

app.listen(8889);

process.on("uncaughtException", onUncaughtException);


//======================================
//      handling uncaught exceptions
//======================================

function onUncaughtException(err) {
    var err = "uncaught exception: " + err;
    console.log(err);
}

var CANVASHEIGHT, CANVASWIDTH;
var availableCharacters = new Array();
var Player = {
   player : 'black',
   position: {x: 200, y: 200,},
   direction: {velX: 0, velY: 0,},
   bullets: new Array(),
   health: 100,
};

var players = new Array();
players.push(Player);
var Player2 = {
   player : 'blue',
   position: {x: 200, y: 200,},
   direction: {velX: 0, velY: 0,},
   bullets: new Array(),
   health: 100,
};
players.push(Player2);

var firstPlayer;

var enemies = new Array();
// Initialize the socket.io library
// Start the socket.io server on port 3000
// Remember.. this also serves the socket.io.js file!
var io = require('socket.io').listen(3000);
io.set('log level', 1);
// Listen for client connection event
// io.sockets.* is the global, *all clients* socket
// For every client that is connected, a separate callback is called
io.sockets.on('connection', function(socket){
    // Listen for this client's "send" event
    // remember, socket.* is for this particular client
    socket.on('send', function(data) {
        // Since io.sockets.* is the *all clients* socket,
        // this is a broadcast message.
        // Broadcast a "receive" event with the data received from "send"
        // Only rebroadcast if the message is properly signed (i.e.
        // player matches their sessionID).
        if(idToUser[sessToId[data.sessId]].username === data.player) {
            io.sockets.emit('receive', {player: data.player, velocity: data.velocity});
        }
    });
    
    socket.on('updateAvailableCharacters', function(data) {
       if(data === 'reset'){
          var len = availableCharacters.length;
          availableCharacters.splice(0,len);
          return;
       }
       if(availableCharacters.indexOf(data) < 0 && availableCharacters.length < 2){
          availableCharacters.push(data);
       }
    });
    
    socket.on('toggleSendAvailableCharacters', function(data) {
       console.log(availableCharacters);
       if(data === true){
           if(availableCharacters.length >= 2 && availableCharacters.indexOf('black') >= 0 && availableCharacters.indexOf('blue') >= 0){
                firstPlayer = 'neither';
                enemies.splice(0,enemies.length);
            }
           socket.emit('getAvailableCharacters', availableCharacters);
       }
    });
    
    
    socket.on('updatePlayerInfo', function(playerInfo){
        for(var i = 0; i < players.length; i++){
            if(players[i].player === playerInfo.player){
               players[i].position = playerInfo.position;
               players[i].direction = playerInfo.direction;
               players[i].bullets = playerInfo.bullets;
               players[i].health = playerInfo.health;
            }
            io.sockets.emit('updateWithServerPosition', players[i]);
        }
    });
    
    socket.on('updateCanvasInfo', function(canvasInfo){
         CANVASWIDTH = canvasInfo.CANVASWIDTH;
         CANVASHEIGHT = canvasInfo.CANVASHEIGHT;
    });
    
    socket.on('sendEnemies', function(enemyArray){
         if(enemies.length < 1)
            enemies = enemyArray;
         socket.emit('updateEnemyPositionWithServer', enemies);
         socket.emit('updateEnemyHealthWithServer', enemies);
    });
    
    socket.on('updateEnemiesPosition', function(enemyList){
      if(enemies.length < 1)
         return;
      for(var i = 0; i < enemyList.length; i++){
         if(enemyList[i].movement){
            if(enemies[i].x != enemyList[i].x)
               enemies[i].x = enemyList[i].x;
            if(enemies[i].y != enemyList[i].y)
               enemies[i].y = enemyList[i].y;
         }
      }
      socket.emit('updateEnemyPositionWithServer', enemies);
    });
    
    socket.on('updateEnemiesHealth', function(enemyList){
      if(enemies.length <1)
         return;
      for(var i = 0; i < enemyList.length; i++){
            enemies[0].health = -2;
      }
      io.sockets.emit('updateEnemyHealthWithServer', enemies);
    });
    
    socket.on('checkIn', function(playerInfo){
        console.log(firstPlayer);
        if(firstPlayer == undefined || firstPlayer == 'neither'){
            firstPlayer = playerInfo.player;
            
        }
        socket.emit('makeFirstPlayer', firstPlayer);
    });
});