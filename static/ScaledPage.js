ScaledPage = function(canvas, virtualWidth){
    this.canvas = canvas;
    this.page = this.canvas[0].getContext('2d');
    this.scale = this.canvas.width() / virtualWidth;
}

ScaledPage.prototype.pageToCanvas = function(pageX, pageY) {
    var offset = this.canvas.offset();
    var x = (pageX - offset.left)  / this.scale;
    var y = (pageY - offset.top)   / this.scale;
    return { 'x': x,
             'y': y
           };
}

ScaledPage.prototype.canvasToPage = function(canvasX, canvasY) {
    // Note: converting to page does not take into account the offset of
    // the canvas because when you draw at the returned location it will
    // automatically be offset by that amount.
    return { 'x': canvasX * this.scale,
             'y': canvasY * this.scale
           };
}

ScaledPage.prototype.fillRect = function(x, y, width, height, style){
    this.page.fillStyle = style;
    this.page.fillRect(x * this.scale, y * this.scale, width * this.scale, height*this.scale);
}

ScaledPage.prototype.strokeRect = function(x, y, width, height, style, lineWidth){
    this.page.lineWidth = lineWidth;
    this.page.strokeStyle = style;
    this.page.strokeRect(x * this.scale, y * this.scale, width * this.scale, height*this.scale);
}

ScaledPage.prototype.strokeRoundedRect = function(x,y,width,height,radius,style, lineWidth){
    x = x*this.scale;
    y = y*this.scale;
    width = width*this.scale;
    height = height*this.scale;
    radius = radius*this.scale;
    this.page.strokeStyle = style;
    this.page.lineWidth = lineWidth;
    this.page.beginPath();
    this.page.moveTo(x,y+radius);
    this.page.lineTo(x,y+height-radius);
    this.page.quadraticCurveTo(x,y+height,x+radius,y+height);
    this.page.lineTo(x+width-radius,y+height);
    this.page.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
    this.page.lineTo(x+width,y+radius);
    this.page.quadraticCurveTo(x+width,y,x+width-radius,y);
    this.page.lineTo(x+radius,y);
    this.page.quadraticCurveTo(x,y,x,y+radius);
    this.page.stroke();
}

ScaledPage.prototype.fillRoundedRect = function(x,y,width,height,radius,style){
    x = x*this.scale;
    y = y*this.scale;
    width = width*this.scale;
    height = height*this.scale;
    radius = radius*this.scale;
    this.page.fillStyle = style;
    this.page.beginPath();
    this.page.moveTo(x,y+radius);
    this.page.lineTo(x,y+height-radius);
    this.page.quadraticCurveTo(x,y+height,x+radius,y+height);
    this.page.lineTo(x+width-radius,y+height);
    this.page.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
    this.page.lineTo(x+width,y+radius);
    this.page.quadraticCurveTo(x+width,y,x+width-radius,y);
    this.page.lineTo(x+radius,y);
    this.page.quadraticCurveTo(x,y,x,y+radius);
    this.page.closePath();
    this.page.fill();
}

ScaledPage.prototype.fillCircle = function(x, y, radius, style){
    this.page.fillStyle = style;
    this.page.beginPath();
    this.page.arc(x * this.scale, y * this.scale, radius * this.scale, 0, Math.PI*2, true);
    this.page.closePath();
    this.page.fill();
}

ScaledPage.prototype.strokeCircle = function(x, y, radius, style, lineWidth){
    this.page.lineWidth = lineWidth;
    this.page.strokeStyle = style;
    this.page.beginPath();
    this.page.arc(x * this.scale, y * this.scale, radius * this.scale, 0, Math.PI*2, true);
    this.page.stroke();
}

ScaledPage.prototype.fillOval = function(x, y, width, height, style){
     var centerX = x * this.scale;
     var centerY = y * this.scale;
     width = width * this.scale;
     height = height * this.scale;
	
     this.page.beginPath();
     
     this.page.moveTo(centerX, centerY - height/2); // A1
     
     this.page.bezierCurveTo(
       centerX + width/2, centerY - height/2, // C1
       centerX + width/2, centerY + height/2, // C2
       centerX, centerY + height/2); // A2

     this.page.bezierCurveTo(
       centerX - width/2, centerY + height/2, // C3
       centerX - width/2, centerY - height/2, // C4
       centerX, centerY - height/2); // A1
    
     this.page.fillStyle = style;
     this.page.fill();
     this.page.closePath();	
}

ScaledPage.prototype.fillText = function(text, x, y, style){
     this.page.fillStyle = style;
     this.page.fillText(text, x*this.scale, y*this.scale);
}

ScaledPage.prototype.drawBackground = function(x, y, width, height){
     x = x*this.scale;
     y = y*this.scale;
     width = width*this.scale;
     height = height*this.scale;
     var img=document.getElementById("background");
     var imgWidth = 500*this.scale;
     var imgHeight = 500*this.scale;
    
     for(var i = 0; i < Math.round(width/imgWidth); i++)
       for(var j = 0; j < Math.round(height/imgHeight); j++)
         this.page.drawImage(img,x + i*imgWidth,y + j*imgHeight,imgWidth,imgHeight);

}

ScaledPage.prototype.drawBlackPlayer = function(x, y, xDir, yDir){
    var rotation = Math.atan2(yDir*this.scale, xDir*this.scale) + Math.PI/2;
    x = x*this.scale;
    y = y*this.scale;
    
    this.page.save();

    this.page.translate(x,y);
    this.page.rotate(rotation);
     
    var img=document.getElementById("blackPlayer");
    var imgWidth = 210*this.scale;
    var imgHeight = 210*this.scale;
    this.page.drawImage(img, 0 - imgWidth/2, 0 - imgHeight/2, imgWidth, imgHeight);
    this.page.restore();
}

ScaledPage.prototype.drawBluePlayer = function(x, y, xDir, yDir){
    var rotation = Math.atan2(yDir*this.scale, xDir*this.scale) + Math.PI/2;
    x = x*this.scale;
    y = y*this.scale;
    
    this.page.save();

    this.page.translate(x,y);
    this.page.rotate(rotation);

    var img=document.getElementById("bluePlayer");
    var imgWidth = 210*this.scale;
    var imgHeight = 210*this.scale;
    this.page.drawImage(img, 0 - imgWidth/2, 0 - imgHeight/2, imgWidth, imgHeight);
    this.page.restore();
}

ScaledPage.prototype.drawCrawler = function(x, y, xDir, yDir, crawler){
    var rotation = Math.atan2(yDir*this.scale, xDir*this.scale) + Math.PI/2;
    x = x*this.scale;
    y = y*this.scale;
    
    this.page.save();

    this.page.translate(x,y);
    this.page.rotate(rotation);

    var imgWidth = 210*this.scale;
    var imgHeight = 210*this.scale;
    this.page.drawImage(crawler, 0 - imgWidth/2, 0 - imgHeight/2, imgWidth, imgHeight);
    this.page.restore();
}
