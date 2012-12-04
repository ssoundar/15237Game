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
};

var players = new Array();
players.push(Player);
var Player2 = {
   player : 'blue',
   position: {x: 300, y: 300,},
   direction: {velX: 0, velY: 0,},
   bullets: new Array(),
};
players.push(Player2);
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
           socket.emit('getAvailableCharacters', availableCharacters);
       }
    });
    
    socket.on('stepPlayerPosition', function(stepInfo){
        for(i = 0; i < players.length; i++){
           if(players[i].player == stepInfo.player){
                var timeDiff = stepInfo.timeDiff;
                players[i].position.x += players[i].direction.velX*(timeDiff/20);
                players[i].position.y += players[i].direction.velY*(timeDiff/20);
                var radius = 50;
                if(players[i].position.x < radius)
                  players[i].position.x = radius;
                if(players[i].position.x > CANVASWIDTH - radius)
                  players[i].position.x = CANVASWIDTH - radius;
                if(players[i].position.y < radius)
                  players[i].position.y = radius;
                if(players[i].position.y > CANVASHEIGHT - radius)
                  players[i].position.y = CANVASHEIGHT - radius;
           }
        }
        socket.emit('updatePlayerPosition', players[0]);
        socket.emit('updatePlayerPosition', players[1]);
    });
    
    socket.on('updatePlayerInfo', function(playerInfo){
        for(var i = 0; i < players.length; i++){
            if(players[i].player === playerInfo.player){
               players[i].position = playerInfo.position;
               players[i].direction = playerInfo.direction;
               players[i].bullets = playerInfo.bullets;
               //console.log(players[i].player + " " + players[i].position.x+" ,"+players[i].position.y);
            }
            socket.emit('updateWithServerPosition', players[i]);
        }
        //console.log(players[0].player + ":" + players[0].position.x + ", "+players[0].position.y);
        //console.log(players[1].player + ":" + players[1].position.x + ", "+players[1].position.y);
    });
    
    socket.on('updateCanvasInfo', function(canvasInfo){
         CANVASWIDTH = canvasInfo.CANVASWIDTH;
         CANVASHEIGHT = canvasInfo.CANVASHEIGHT;
    });
});