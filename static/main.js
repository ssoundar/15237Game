$(document).ready(function() {
    var pong = new Pong();
    pong.init();
});

/********
 * Pong
 ********/
var Pong = function() {

}

Pong.prototype.init = function() {
    this.canvas = document.getElementById("myCanvas"),
    this.ctx = this.canvas.getContext('2d');

    this.leftPaddle = new Paddle(10);
    this.rightPaddle = new Paddle(this.canvas.width - 20);
    
    this.player1 = new Player(this.leftPaddle, 87, 83); // w, s
    this.player2 = new Player(this.rightPaddle, 73, 75); // i, k

    this.ball = new Ball();

    // Make a connection to the socket.io server
    this.socket = io.connect('http://popat.res.cmu.edu:3000/');

    var ref = this;
    // When getting a "receive" event from the server
    this.socket.on('receive', function(data) {
        ref[data.player].vel = parseInt(data.velocity);
    });


    this.redraw(); // Initial draw
    var ref = this;
    this.drawLoop = setInterval(this.redraw.bind(this), 20); // Redraw loop
}

Pong.prototype.redraw = function() {
    this.update();

    this.clearCanvas();
    this.drawBackground();
    this.drawPaddles();
    this.drawBall();
    this.drawScore();
}

Pong.prototype.clearCanvas = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

Pong.prototype.drawBackground = function() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

Pong.prototype.drawPaddles = function() {
    this.leftPaddle.draw();
    this.rightPaddle.draw();
}

Pong.prototype.drawBall = function() {
    this.ball.draw();
}

Pong.prototype.drawScore = function() {
    this.ctx.fillStyle = "#00FF00";
    this.ctx.font = "bold 16px Arial";
    this.ctx.fillText("Player 1: " + this.player1.score, 25, 20);
    this.ctx.fillText("Player 2: " + this.player2.score, this.canvas.width - 115, 20);
}

Pong.prototype.update = function() {
    this.checkScore();
    this.player1.update();
    this.player2.update();
    this.ball.move(this.leftPaddle, this.rightPaddle);
}

Pong.prototype.checkScore = function() { 
    switch(this.ball.outOn) {
        case 'p1':
            this.scorePlayer(this.player2);
            break;
        case 'p2':
            this.scorePlayer(this.player1);
            break;
        default:
            break;
    }
}

Pong.prototype.scorePlayer = function(player) {
    player.score += 1;
    this.ball.reset();
}


/********
 * Player
 ********/
 
 var Player = function(paddle, upKey, downKey) {
    this.canvas = document.getElementById("myCanvas"),
    this.ctx = this.canvas.getContext('2d');
 
    this.paddle = paddle;
    this.score = 0;
    this.vel = 0;
    this.initHandlers(upKey, downKey);
 }
 
 Player.prototype.initHandlers = function(upKey, downKey) {
    var ref = this;
    $(window).keydown(function(e) {
        if(e.which == upKey) { 
            ref.vel = -10;
        }
        else if(e.which == downKey) {
            ref.vel = 10;
        }
    });
    
    $(window).keyup(function(e) {
        if(e.which == upKey) {
            ref.vel = 0;
        }
        else if(e.which == downKey) {
            ref.vel = 0;
        }
    });
 }

 Player.prototype.update = function() {
    if(this.vel !== 0 &&
       this.paddle.y + this.vel >= 0 && 
       this.paddle.y + this.paddle.height + this.vel <= this.canvas.height) {
        this.paddle.y += this.vel;
    }
 }

/********
 * Paddle
 ********/
var Paddle = function(x) {
    this.canvas = document.getElementById("myCanvas"),
    this.ctx = this.canvas.getContext('2d');

    this.width = 10;
    this.height = 80;
    
    this.x = x;
    this.y = 200; //remove
}

Paddle.prototype.draw = function() {
    this.ctx.fillStyle = "#00FF00";
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
}


/********
 * Ball
 ********/
var Ball = function() {
    this.canvas = document.getElementById("myCanvas"),
    this.ctx = this.canvas.getContext('2d');

    this.init();
}

Ball.prototype.init = function() {
    this.radius = 10;
    
    this.velx = ((Math.random() > 0.5) ? 1 : -1) * 5;
    this.vely = ((Math.random() > 0.5) ? 1 : -1) * 5;

    this.outOn = '';
    
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
}

Ball.prototype.draw = function() {
    this.ctx.fillStyle = "#00FF00";
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true); 
    this.ctx.closePath();
    this.ctx.fill();
}

Ball.prototype.move = function(leftPaddle, rightPaddle) {
    this.checkWalls();
    
    this.checkOutOfBounds();
    
    this.checkLeftCollision(leftPaddle);
    this.checkRightCollision(rightPaddle);
    

    this.x += this.velx;
    this.y += this.vely;
}

Ball.prototype.checkWalls = function() {
    if(this.y - this.radius + this.vely < 0 ||
       this.y + this.radius + this.vely > this.canvas.height) {
        this.vely = -1 * this.vely;
    }
}

Ball.prototype.checkLeftCollision = function(paddle) {
    if(this.x - this.radius <= paddle.x + paddle.width &&
       this.y >= paddle.y &&
       this.y <= paddle.y + paddle.height) {
        this.velx = -1 * this.velx;
    }
}

Ball.prototype.checkRightCollision = function(paddle) {
    if(this.x + this.radius >= paddle.x &&
       this.y >= paddle.y &&
       this.y <= paddle.y + paddle.height) {
        this.velx = -1 * this.velx;
    }
}

Ball.prototype.checkOutOfBounds = function() {
    if(this.x - this.radius + this.velx < 0) {
        this.velx = 0;
        this.vely = 0;
        this.outOn = 'p1';
    }
    
    if(this.x + this.radius + this.velx > this.canvas.width) {
        this.velx = 0;
        this.vely = 0;
        this.outOn = 'p2';
    }
}

Ball.prototype.reset = function() {
    this.init();
}