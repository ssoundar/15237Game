//CHAGNETHIS: Address to server
var address = 'http://76.125.178.2:3000/';
//var address = 'http://128.237.242.111:3000/';


//Page and Canvas Statics
var HEIGHT= 800;
var CANVASHEIGHT= 800;
var WIDTH = 1200;
var CANVASWIDTH = 800;
var CONTROL_RADIUS = 50;
var SCALE;

//Player Statics
var MAXSPEED = 8;
var MAG_EPSILON = 0.0001;
//Weapon Statics
var PISTOL = 0;
var PISTOLBULLETSPEED = 15;
var PISTOLSHOOTINGSPEED = 300;
var PISTOLBULLETRADIUS = 15;
var PISTOLDAMAGE = 10;
//Map Objects Statics
var HORIZONTAL = 'horizontal';
var VERTICAL = 'vetical'
var WALL_THICKNESS = 50;
var EDGE_COLOR = 'rgb(65,105,225)'

//Map statics
var MAP_WIDTH = 2000;
var MAP_HEIGHT = 1000;

//Enemy Statics
var SIMPLE_CRAWLER = 1;
var SIMPLE_CRAWLER_SPEED = 1;
var ADVANCED_CRAWLER = 2;
var ADVANCED_CRAWLER_SPEED = 600;
var ANGRY_CRAWLER = 3;
var ANGRY_CRAWLER_SPEED = 100;
//This game's Player
var FIRST_PLAYER;
var MAIN_PLAYER;
 /********
 * Game
 ********/
 var Game = function(playerType, otherPlayer) {
   this.socket = io.connect(address);
   this.socket.emit('updateAvailableCharacters', playerType);
   MAIN_PLAYER = playerType;
   this.playerType = playerType;
   this.otherPlayerType = otherPlayer;
   this.setup();
   window.util.deltaTimeRequestAnimationFrame(this.draw.bind(this));
}

Game.prototype.setup = function(){
   window.util.patchRequestAnimationFrame();
   window.util.patchFnBind();
   this.initCanvas();
   this.map = new Map(this.page);
   this.map.initializeObjectArray();
   
   
   this.player = new Player(this.playerType, this.page, this.map, this.socket);
   this.otherPlayer = new Player(this.otherPlayerType, this.page, this.map);
   this.socket.on('makeFirstPlayer', this.player.makeFirstPlayer.bind(this.player));
   this.socket.on('updateWithServerPosition', this.otherPlayer.updateWithServerLocation.bind(this.otherPlayer));
   this.socket.emit('checkIn',this.player.sendInfo());
   
   this.controller = new Control(this.page, this.player);

   this.socket.on('updateEnemyPositionWithServer', this.map.updateEnemyPositionWithServer.bind(this.map));
   this.socket.on('updateEnemyHealthWithServer', this.map.updateEnemyHealthWithServer.bind(this.map));
   this.socket.emit('sendEnemies',this.map.getEnemyList());
   
   this.body.append($('<div id = "txtmsg">Hello</div>'));
}
Game.prototype.initCanvas = function(){
    this.body = $(document.body);
    this.body.width(document.body.offsetWidth);
    this.body.height(window.innerHeight);
    CANVASHEIGHT = (this.body.height()/this.body.width())*CANVASWIDTH;
    this.width = CANVASWIDTH;
    this.height = CANVASHEIGHT;
    this.canvas = window.util.makeAspectRatioCanvas(this.body, this.width/this.height);
    $(this.canvas).css("z-index","-1");
    this.page = new ScaledPage(this.canvas, this.width);
    SCALE = this.canvas.width() / this.width;
    HEIGHT = this.canvas.height();
    WIDTH = this.canvas.width();
    var canvasInfo = {
         CANVASWIDTH : CANVASWIDTH,
         CANVASHEIGHT: CANVASHEIGHT,
    };
    this.socket.emit('updateCanvasInfo', canvasInfo);
}

/*********
* Drawing
*********/
Game.prototype.draw = function(timeDiff){
    this.clearPage();
    var center = {x: CANVASWIDTH/2, y: CANVASHEIGHT/2,};
    this.updatePlayer(timeDiff, this.player.x - center.x, this.player.y - center.y);
    this.updateEnemies(timeDiff);
    
    
    this.otherPlayer.drawOtherPlayer(this.player.x - center.x, this.player.y - center.y);
    this.otherPlayer.weapon.drawBullets(this.player.x - center.x, this.player.y - center.y);
    
    this.map.drawObjects(this.player.x - center.x, this.player.y - center.y);
    this.checkIfAlive();
}

Game.prototype.clearPage = function(){
    this.page.fillRect(0, 0, this.width, this.height, 'black');
}

Game.prototype.drawBackground = function(){
    var center = {x: CANVASWIDTH/2, y: CANVASHEIGHT/2,};
    this.page.fillRect(center.x - this.player.x, center.y - this.player.y,
                       Math.abs(this.player.x) + this.map.mapWidth-this.player.x, 
                       Math.abs(this.player.y) + this.map.mapHeight-this.player.y,  'white');
}

Game.prototype.updatePlayer = function(timeDiff, x, y){
    this.player.weapon.updateBulletsLocation(timeDiff);
    this.player.updateLocation(timeDiff);
    this.drawBackground();
    this.player.drawMainPlayer();
    this.player.weapon.drawBullets(x,y);
}

Game.prototype.updateEnemies = function(timeDiff){
    var enemies = this.map.enemies;
    var noneKilled = true;
    for(var i = 0; i < enemies.length; i++){
        if(enemies[i].movement){
             enemies[i].move(timeDiff, this.player, this.otherPlayer, this.map);
        }
        if(enemies[i].health == -1){
            this.socket.emit('updateEnemiesHealth', this.map.getEnemyList());
        }
    }
    if(this.player.first)
      this.socket.emit('updateEnemiesPosition', this.map.getEnemyList());
}

Game.prototype.checkIfAlive = function(){
    if(this.player.health <= 0 || this.otherPlayer.health <= 0)
      this.endGame();
}

Game.prototype.endGame = function(){
    this.page.fillRect(0, 0, this.width, this.height, 'black');
}

 
 /********
 * Player
 ********/
 
 var Player = function(playerType, page, map, socket) {
    this.player = playerType;
    this.page = page;
    this.x = 150;
    this.y = 150;
    this.velX = 0;
    this.velY = 0;
    this.map = map;
    this.weapon = new Weapon(this.page, this, this.map);
    this.facingDirection = {xVel: 0.0, yVel: 0.0};
    this.radius = 50;
    this.health = 100;
    this.socket = socket;
 }
 
 Player.prototype.sendInfo = function(){
    return {
       player: this.player,
       position: {x: this.x, y:this.y,},
       direction: {velX: this.velX, velY: this.velY},
       bullets: this.weapon.bullets,
       health: this.health,
    };
 }
 
 Player.prototype.updateVelocity = function(x,y){
    this.velX = x;
    this.velY = y;
 }
 
 Player.prototype.updateLocation = function(timeDiff){
    var oldx = this.x;
    var oldy = this.y;
    this.x += this.velX*(timeDiff/20);
    
    var radius = this.radius;
    if(this.x < radius)
      this.x = radius;
    if(this.x > this.map.mapWidth - radius)
      this.x = this.map.mapWidth - radius;  
    var collisionRet = this.map.checkCollision(this.boundingCircle());
    if(collisionRet.collided){
        if(collisionRet.collidedObject.passable){  
            if(collisionRet.collidedObject.enemy){
               this.hitEnemy(collisionRet.collidedObject);
            }
        }else{
            this.x = oldx;
        }
    } 
    
    this.y += this.velY*(timeDiff/20);
    if(this.y < radius)
      this.y = radius;
    if(this.y > this.map.mapHeight - radius)
      this.y = this.map.mapHeight - radius;
    collisionRet = this.map.checkCollision(this.boundingCircle());
    if(collisionRet.collided){
        if(collisionRet.collidedObject.passable){
            if(collisionRet.collidedObject.enemy)
               this.hitEnemy(collisionRet.collidedObject);
        }else{
            this.y = oldy;
        }
    }
    this.socket.emit('updatePlayerInfo', this.sendInfo());
 }
 Player.prototype.updateWithServerLocation = function(data){   
    if(data.player == this.player){ 
       this.x = data.position.x;
       this.y = data.position.y;  
       this.weapon.bullets = data.bullets;
       var radius = 50;
       if(this.x < radius)
         this.x = radius;
       if(this.x > this.map.mapWidth - radius)
         this.x = this.map.mapWidth - radius;
       if(this.y < radius)
         this.y = radius;
       if(this.y > this.map.mapHeight - radius)
         this.y = this.map.mapHeight - radius;
       this.health = data.health;
    }
 }
 
 Player.prototype.drawOtherPlayer = function(x,y){
    this.page.fillCircle(this.x-x, this.y-y, this.radius, this.player);
 }
 
  Player.prototype.drawMainPlayer = function(){
    this.page.fillCircle(CANVASWIDTH/2, CANVASHEIGHT/2, this.radius, this.player);
 }
 
 Player.prototype.boundingCircle = function(){
    var circle = {
        x: this.x,
        y: this.y,
        radius : this.radius,
    };
    return circle;
 }
 
 
 Player.prototype.hitEnemy = function(obj){
    this.health -= obj.damage;
    obj.health = -1;
 }
 
 Player.prototype.makeFirstPlayer = function(player){
    FIRST_PLAYER = player;
    if(this.player == player)
      this.first = true;
    else
      this.first = false;
 }
 /*******************
 * Weapon
 ******************/
 var Weapon = function(mainPage, mainPlayer, map){
     this.page = mainPage;
     this.player = mainPlayer;
     this.type = PISTOL;
     this.bullets = new Array();
     this.bulletSpeed = PISTOLBULLETSPEED;
     this.shootingSpeed = PISTOLSHOOTINGSPEED;
     if(this.player.player == 'black')
        this.bulletColor = 'red';
     if(this.player.player == 'blue')
        this.bulletColor = 'green';
     this.map = map;
     this.bulletRadius = PISTOLBULLETRADIUS;
     this.bulletDamage = PISTOLDAMAGE;
 }

 Weapon.prototype.shoot = function(){
     var direction = this.player.facingDirection;
     if(this.type === PISTOL){
        var bullet = {
           x: this.player.x,
           y: this.player.y,
           direction: direction,
        };
        this.bullets.push(bullet);     
     }
 }
 
 Weapon.prototype.drawBullets = function(x,y){
      for(var i = 0; i < this.bullets.length; i++){
         this.page.fillCircle(this.bullets[i].x-x, this.bullets[i].y-y, this.bulletRadius, this.bulletColor);
      }
 }
 
 Weapon.prototype.updateBulletsLocation = function(timeDiff){
      var bullet, circle;
      for(var i = 0; i < this.bullets.length; i++){
         bullet = this.bullets[i];
         bullet.x += this.bulletSpeed*bullet.direction.xVel*(timeDiff/20);
         bullet.y += this.bulletSpeed*bullet.direction.yVel*(timeDiff/20);
         if(bullet.x < 0 || bullet.y < 0 || bullet.x > this.map.mapWidth || bullet.y > this.map.mapHeight)
            this.bullets.splice(i,1);
         circle = {
              x: bullet.x,
              y: bullet.y,
              radius: this.bulletRadius,
         };
         var collisionRet = this.map.checkCollision(circle);
         if(collisionRet.collided){
            this.bullets.splice(i,1);
            if(collisionRet.collidedObject.enemy){
                collisionRet.collidedObject.health -= this.bulletDamage;
                if(collisionRet.collidedObject.health <= 0){
                   collisionRet.collidedObject.health = -1;
                }
            }
         }
      }
 }
 
 
 /*******************
 * Movement Control
 *******************/
 
 var Control = function(mainPage, mainPlayer) {
    this.player = mainPlayer;
    this.page = mainPage;
    this.shootingID;
    this.setup();
 }
 
Control.prototype.setup = function(){
    //if ('ontouchstart' in document.documentElement){
      this.initControllerBackground();
      this.initShootingControllerBackground();
      //this.initControllerStick();
    //}
    //else{
    //  alert("No Touch Device Found, use arrow keys and mouse instead");
    //}
 }

Control.prototype.initControllerBackground = function(){
    var controlCoords = {x: 0, y: 0,};
    controlCoords.x = 20;
    controlCoords.y = HEIGHT - 2*CONTROL_RADIUS - 20;
    var radius = CONTROL_RADIUS;
    var controller = $('<div class="controller"></div>');
    controller.css("left", controlCoords.x);
    controller.css("top", controlCoords.y);
    controller.css("border-radius", radius);
    controller.css("-webkit-border-radius", radius);
    controller.css("-moz-border-radius", radius);
    controller.css("height", radius*2);
    controller.css("width", radius*2);
    
    var down = this.finalControllerDown.bind(this); 

    var up = this.finalControllerUp.bind(this); 
    var tap = function(){
       //alert("tap");
    };
    var move = this.finalControllerMove.bind(this); 

    controller.ontap(down, up, tap, move, this);
    $('body').append(controller);
 }
 
 Control.prototype.movePlayer = function(x,y){
       var center = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);

       var minX = 20;
       var minY = HEIGHT - 2*CONTROL_RADIUS - 20;
       var maxX = minX + 2*CONTROL_RADIUS;
       var maxY = minY + 2*CONTROL_RADIUS;
       
       if(x < minX || x > maxX || y < minY || y > maxY)
         return;
    
       center.x = 20 + CONTROL_RADIUS - radius;
       center.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       
       var velX = ((x - center.x));
       var velY = ((y - center.y));
       var mag = Math.sqrt((velX*velX) + (velY*velY));
       if(mag < MAG_EPSILON){
         velX = 0;
         velY = 0;
       }
       else{
          velX = MAXSPEED*((x - center.x)/mag);
          velY = MAXSPEED*((y - center.y)/mag);
       }
       
       this.player.updateVelocity(velX, velY);
    }
 Control.prototype.stopPlayer = function(){
       var controlCoords = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);
    
       controlCoords.x = 20 + CONTROL_RADIUS - radius;
       controlCoords.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       this.movePlayer(controlCoords.x, controlCoords.y);
    }
    
    
    
 /*******************
 * Shooting Control
 *******************/
 

 Control.prototype.initShootingControllerBackground = function(){
    var controlCoords = {x: 0, y: 0,};
    controlCoords.x = WIDTH - 2*CONTROL_RADIUS - 20;
    controlCoords.y = HEIGHT - 2*CONTROL_RADIUS - 20;
    var radius = CONTROL_RADIUS;
    var controller = $('<div class="controller"></div>');
    controller.css("left", controlCoords.x);
    controller.css("top", controlCoords.y);
    controller.css("border-radius", radius);
    controller.css("-webkit-border-radius", radius);
    controller.css("-moz-border-radius", radius);
    controller.css("height", radius*2);
    controller.css("width", radius*2);
    
    var down = this.finalControllerDown.bind(this); 

    var up = this.finalControllerUp.bind(this); 
    var tap = function(){
       //alert("tap");
    };
    var move = this.finalControllerMove.bind(this);  

    controller.ontap(down, up, tap, move, this.player);
    $('body').append(controller);
 }
 
 Control.prototype.startShooting = function(x,y){
      var direction = this.getFacingDirection(x,y);
      this.player.facingDirection = direction;
      if(this.shootingID !== undefined) 
         clearInterval(this.shootingID);
      this.shootingID = setInterval(this.player.weapon.shoot.bind(this.player.weapon), this.player.weapon.shootingSpeed);
 }
 Control.prototype.changeFacingDirection = function(x,y){
      var direction = this.getFacingDirection(x,y);
      this.player.facingDirection = direction;
 }
 Control.prototype.getFacingDirection = function(x,y){
       var center = {x: 0, y: 0,};
       var radius = CONTROL_RADIUS * (1/10);

       var minX = WIDTH - 2*CONTROL_RADIUS - 20;
       var minY = HEIGHT - 2*CONTROL_RADIUS - 20;
       var maxX = minX + 2*CONTROL_RADIUS;
       var maxY = minY + 2*CONTROL_RADIUS;
       if(x < minX)
          x = minX;
       if(y < minY)
          y = minY;
       if(x > maxX)
          x = maxX;
       if(y > maxY)
          y = maxY;

    
       center.x = WIDTH - 2*CONTROL_RADIUS - 20 + CONTROL_RADIUS - radius;
       center.y = HEIGHT - CONTROL_RADIUS - 20 - radius;
       

       var velX = ((x - center.x));
       var velY = ((y - center.y));
       var mag = Math.sqrt((velX*velX) + (velY*velY));
       if(mag < MAG_EPSILON){
         velX = 0;
         velY = 0;
       }
       else{
          velX = ((x - center.x)/mag);
          velY = ((y - center.y)/mag);
       }
       
       return {xVel: velX, yVel: velY};
       
    }
 Control.prototype.stopShooting = function(){
       clearInterval(this.shootingID);
    }
 
 /*******************
 *  Combined Controls
 *******************/
  Control.prototype.finalControllerDown = function(x,y){
    if(x < WIDTH/2)
      this.movePlayer(x,y);
    if(x > WIDTH/2)
      this.startShooting(x,y); 
 }
 
 Control.prototype.finalControllerMove = function(x,y){
    if(x < WIDTH/2)
      this.movePlayer(x,y);
    if(x > WIDTH/2)
      this.changeFacingDirection(x,y); 
 }
 
 Control.prototype.finalControllerUp = function(){
    this.stopPlayer();
    this.stopShooting(); 
 }
 /*******************
 * Map
 *******************/
 var Map = function(mainPage){
     this.page = mainPage;
     this.objects = new Array();
     this.enemies = new Array();
     this.mapWidth = MAP_WIDTH;
     this.mapHeight = MAP_HEIGHT;
 }
 
 Map.prototype.initializeObjectArray = function(){
     var opening = 400;
     var frequency = 400;
     var edgeWall1 = new Wall(this.page, 0, 0, HORIZONTAL, this.mapWidth, EDGE_COLOR);
     var edgeWall2 = new Wall(this.page, 0, this.mapHeight - WALL_THICKNESS, HORIZONTAL, this.mapWidth, EDGE_COLOR);
     var edgeWall3 = new Wall(this.page, 0, 0, VERTICAL, this.mapHeight, EDGE_COLOR);
     var edgeWall4 = new Wall(this.page, this.mapWidth - WALL_THICKNESS, 0, VERTICAL, this.mapHeight, EDGE_COLOR);
     
     this.objects.push(edgeWall1);
     this.objects.push(edgeWall2);
     this.objects.push(edgeWall3);
     this.objects.push(edgeWall4);
     var startWidth = frequency;
     while(startWidth < this.mapWidth - frequency){
         var newWall1 = new Wall(this.page, startWidth, 0, VERTICAL, this.mapHeight - opening, EDGE_COLOR);
         var newWall2 = new Wall(this.page, startWidth+frequency, opening, VERTICAL, this.mapHeight - opening, EDGE_COLOR);
         startWidth += 2*frequency;
         this.objects.push(newWall1);
         this.objects.push(newWall2);
     }
     this.initializeEnemyArray();
 }
 Map.prototype.initializeEnemyArray = function(){
     this.addEnemy(SIMPLE_CRAWLER, 600, 500);
     this.addEnemy(SIMPLE_CRAWLER, 700, 500);
     this.addEnemy(SIMPLE_CRAWLER, 500, 100);
     this.addEnemy(ADVANCED_CRAWLER, 600, 200);
     this.addEnemy(ANGRY_CRAWLER, 900, 200);
 }
 Map.prototype.drawObjects = function(x,y){
      for(var i = 0; i < this.objects.length; i++){
         var mapx = this.objects[i].x;
         var mapy = this.objects[i].y;
         
         this.objects[i].x = this.objects[i].x - x;
         this.objects[i].y = this.objects[i].y - y;
         
         this.objects[i].draw();
         
         this.objects[i].x = mapx;
         this.objects[i].y = mapy;
      }
      for(var i = 0; i < this.enemies.length; i++){
         var mapx = this.enemies[i].x;
         var mapy = this.enemies[i].y;
         
         this.enemies[i].x = this.enemies[i].x - x;
         this.enemies[i].y = this.enemies[i].y - y;
         
         this.enemies[i].draw();
         
         this.enemies[i].x = mapx;
         this.enemies[i].y = mapy;
      }
 }
 
 Map.prototype.checkCollision = function(circle){
     var check = this.checkCollisionObjects(circle);
     if(check.collided)
         return check;
     check = this.checkCollisionEnemies(circle);
     if(check.collided)
         return check;
     return {collided: false,};
 }
 
 Map.prototype.checkCollisionObjects = function(circle){
      for(var i = 0; i < this.objects.length; i++){
           if(this.objects[i].isCollision(circle))
               return {collided: true, collidedObject: this.objects[i],};
      }
      return {collided: false,};
 }
 
 Map.prototype.checkCollisionEnemies = function(circle){
      for(var i = 0; i < this.enemies.length; i++){
           if(this.enemies[i].isCollision(circle))
               return {collided: true, collidedObject: this.enemies[i],};
      }
      return {collided: false,};
 }
 
 Map.prototype.getEnemyList = function(){
      var list = new Array();
      for(var i = 0; i < this.enemies.length; i++){
         list.push(this.enemies[i].boundingCircle());
      }
      return list;
 }
 
 Map.prototype.updateEnemyPositionWithServer = function(enemyList){
      for(var i = 0; i < enemyList.length; i++){
         if(enemyList[i].movement){
           if(MAIN_PLAYER != FIRST_PLAYER){
               if(this.enemies[i].x != enemyList[i].x)
                  this.enemies[i].x = enemyList[i].x;
               if(this.enemies[i].y != enemyList[i].y)
                  this.enemies[i].y = enemyList[i].y;
           }
         }
      }
 }
 Map.prototype.updateEnemyHealthWithServer = function(enemyList){
      
      for(var i = 0; i < enemyList.length; i++){
         if(enemyList[i].health <= 0)
            this.enemies[i].health = -2;
      }
      $("#txtmsg").text(enemyList[0].health + " " + this.enemies[0].health);
 }
 Map.prototype.addEnemy = function(type, initX, initY){
      switch(type){
                 case SIMPLE_CRAWLER:
                     this.enemies.push(new SimpleCrawler(this.page, initX, initY));
                     break;
                 case ADVANCED_CRAWLER:
                     this.enemies.push(new AdvancedCrawler(this.page, initX, initY));
                     break;
                 case ANGRY_CRAWLER:
                     this.enemies.push(new AngryCrawler(this.page, initX, initY));
                     break;
      }
 }
 /*****************
 *  Map Objects
 *****************/
 
function MapObject(mainPage, initX, initY){
      this.page = mainPage;
      this.x = initX;
      this.y = initY;
      this.orientation = 'up';
      this.width = 2;
      this.height = 2;
 }
 
MapObject.prototype.isCollision = function(circle){
      var rect = {x: this.x + this.width/2, y: this.y + this.height/2,};
      var circDist = {x: Math.abs(circle.x - rect.x), y: Math.abs(circle.y - rect.y)};
      if(circDist.x > (this.width/2 + circle.radius))
         return false;
      if(circDist.y > (this.height/2 + circle.radius))
         return false;
      
      if(circDist.x <= (this.width/2))
         return true;
      if(circDist.y <= (this.height/2))
         return true;
      
      var cornerDist = Math.pow((circDist.x - this.width/2),2) + Math.pow((circDist.y - this.height/2),2);
      return (cornerDist <= Math.pow(circle.radius,2));
 }
 
 /**************
 * Wall
 **************/
 function Wall(mainPage, initX, initY, orientation, length, color){
      this.page = mainPage;
      this.x = initX;
      this.y = initY;
      this.orientation = orientation;
      if(orientation == HORIZONTAL){
         this.width = length;
         this.height = WALL_THICKNESS;
      }
      else if(orientation == VERTICAL){
         this.width = WALL_THICKNESS;
         this.height = length;
      }
      this.passable = false;
      this.color = color;
 }
 
 Wall.prototype = new MapObject();
 Wall.prototype.constructor = Wall;
 Wall.prototype.draw = function(){
       this.page.fillRect(this.x, this.y, this.width, this.height, this.color);
 }
 
 /*****************
 * Enemies
 *****************/
  function Enemy(mainPage, initX, initY){
      this.page = mainPage;
      this.x = initX;
      this.y = initY;
      this.radius = 10;
      this.color = 'red';
      this.damage = 200;
      this.health = 20;
      this.enemy = true;
      this.passable = true;
      this.type = 0;
      this.movement = false;
 }
 Enemy.prototype = new MapObject();
 Enemy.prototype.constructor = Enemy;
 Enemy.prototype.draw = function(){
      if(this.health > 0)
       this.page.fillCircle(this.x, this.y, this.radius, this.color);
 }
 Enemy.prototype.isCollision = function(circle){
      if(this.health <= 0)
         return false;
      var dist = Math.pow((circle.x - this.x),2) + Math.pow((circle.y - this.y),2);
      if(dist < Math.pow((circle.radius + this.radius),2)){
         return true;
      }
      return false;
 }
 Enemy.prototype.boundingCircle = function(){
    var circle = {
        x: this.x,
        y: this.y,
        radius : this.radius,
        type: this.type,
        movement: this.movement,
        health: this.health,
    };
    return circle;
 }
 
 /****************
 * Simple Crawler
 ****************/
 function SimpleCrawler(mainPage, initX, initY){
      this.type = SIMPLE_CRAWLER;
      this.page = mainPage;
      this.x = initX;
      this.y = initY;
      this.radius = 25;
      this.color = 'lightgreen';
      this.damage = 5;
      this.health = 20;
      this.moveSpeed = SIMPLE_CRAWLER_SPEED;
      this.movement = true;
 }
 SimpleCrawler.prototype = new Enemy();
 SimpleCrawler.prototype.constructor = SimpleCrawler;
 SimpleCrawler.prototype.move = function(timeDiff, player1, player2, map){
       this.simpleMove(timeDiff, player1, player2, map);
 }
 SimpleCrawler.prototype.simpleMove = function(timeDiff, player1, player2, map){
       if(this.health <= 0)
         return;
       var dist1 = Math.pow((player1.x - this.x),2) + Math.pow((player1.y - this.y),2);
       var dist2 = Math.pow((player2.x - this.x),2) + Math.pow((player2.y - this.y),2);
       
       var moveTo;
       if(dist1 < dist2)
         moveTo = player1;
       else
         moveTo = player2;
         
       var velX = moveTo.x - this.x;
       var velY = moveTo.y - this.y;
       
       var mag = Math.sqrt((velX*velX) + (velY*velY));
       
       if(mag < MAG_EPSILON){
         velX = 0;
         velY = 0;
       }
       else{
          velX = this.moveSpeed*(velX/mag);
          velY = this.moveSpeed*(velY/mag);
       }

       var radius = this.radius;
       var collisionRet;
       
       var oldx = this.x;
       var oldy = this.y;
       
       this.x += velX*(timeDiff/20);
       if(this.x < radius)
         this.x = radius;
       if(this.x > map.mapWidth - radius)
         this.x = map.mapWidth - radius;
       collisionRet = map.checkCollisionObjects(this.boundingCircle());
       
       if(collisionRet.collided){
           this.x = oldx;
       }
       
       this.y += velY*(timeDiff/20);
       if(this.y < radius)
         this.y = radius;
       if(this.y > map.mapHeight - radius)
         this.y = map.mapHeight - radius;
       collisionRet = map.checkCollisionObjects(this.boundingCircle());
       if(collisionRet.collided){
           this.y = oldy;
       }
 }
 
 /*****************
 * Advanced Crawler
 ******************/
 function AdvancedCrawler(mainPage, initX, initY){
      this.type = SIMPLE_CRAWLER;
      this.page = mainPage;
      this.x = initX;
      this.y = initY;
      this.radius = 25;
      this.color = 'orange';
      this.damage = 10;
      this.health = 30;
      this.moveSpeed = ADVANCED_CRAWLER_SPEED;
      this.movement = true;
 }
 AdvancedCrawler.prototype = new SimpleCrawler();
 AdvancedCrawler.prototype.constructor = AdvancedCrawler;
 AdvancedCrawler.prototype.move = function(timeDiff, player1, player2, map){
      if(this.health <= 0)
         return;
       var dist1 = Math.pow((player1.x - this.x),2) + Math.pow((player1.y - this.y),2);
       var dist2 = Math.pow((player2.x - this.x),2) + Math.pow((player2.y - this.y),2);

       if(dist1 < dist2)
          this.moveSpeed = ADVANCED_CRAWLER_SPEED/Math.sqrt(dist1);
       else
          this.moveSpeed = ADVANCED_CRAWLER_SPEED/Math.sqrt(dist2);
          
       this.simpleMove(timeDiff, player1, player2, map);
 }
 
 /*****************
 * Angry Crawler
 ******************/
 function AngryCrawler(mainPage, initX, initY){
      this.type = SIMPLE_CRAWLER;
      this.page = mainPage;
      this.x = initX;
      this.y = initY;
      this.radius = 25;
      this.color = 'pink';
      this.damage = 4;
      this.health = 20;
      this.moveSpeed = ANGRY_CRAWLER_SPEED;
      this.movement = true;
 }
 AngryCrawler.prototype = new SimpleCrawler();
 AngryCrawler.prototype.constructor = AngryCrawler;
 AngryCrawler.prototype.move = function(timeDiff, player1, player2, map){
      
       this.moveSpeed = ANGRY_CRAWLER_SPEED/this.health;
       this.damage = 4*this.health;   
       this.simpleMove(timeDiff, player1, player2, map);
 }
 