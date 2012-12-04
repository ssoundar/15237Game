function addTappableJQPlugin(){
    // `this` is the jquery wrapper for the element
    // Functions on `$.fn` can be accessed by any jQuery object
    // * Example: `$('#loc').onButtonTap(fn)`
    //
    // Applies CSS classes on different parts of the tap
    $.fn.onButtonTap = function(tapCB){
        var down = function (){
            this.addClass('buttonDown');
            this.removeClass('buttonUp');
        };
        var up = function (){
            this.removeClass('buttonDown');
            this.addClass('buttonUp');
        };
        this.addClass('button');
        this.addClass('buttonUp');
        this.ontap(down, up, tapCB);
    }
    // onClick with mobile support
    // call `downCB` when button should be down
    // call `upCB` when button should not be down
    // call `tapCB` when the button is tapped
    // call moveCB when we move the touch

    $.fn.ontap = function(downCB, upCB, tapCB, moveCB){
        // bind the callbacks to the jQuery object (standard jQuery behavior)
        downCB = downCB.bind(this);
        upCB = upCB.bind(this);
        tapCB = tapCB.bind(this);

        var startx;
        var starty;
        
        var potentialTap;

        var down = function(x, y){
            startx = x;
            starty = y;
            potentialTap = true;
            downCB(x,y);
        }

        // cancel if the touch moves more than 10px (because it could be a potential scroll)
        var move = function(x, y){
            if (potentialTap){
               moveCB(x,y);
            }
        }

        var exit = function(){
            if (potentialTap){
                potentialTap = false;
            }
            upCB();
        }

        var up = function(){
            if (potentialTap){
                upCB();
                tapCB();
                potentialTap = false;
            }
        }

        // Detects if the browser supports touch events
        if ('ontouchstart' in document.documentElement){

            this.on('touchstart', function(event){
                event.preventDefault();
                var x, y;
                for(var i = 0; i < event.originalEvent.touches.length; i++){
                  x = event.originalEvent.touches[i].clientX;
                  y = event.originalEvent.touches[i].clientY;
                  down(x, y);
                }
            });
            this.on('touchend', function(event){
                event.preventDefault();
                up();
            });
            // cancel on touchleave (finger moves out of object)
            this.on('touchleave', function(event){
                event.preventDefault();
                up();
            });
            this.on('touchcancel', function(event){
                event.preventDefault();
                up();
            });
            this.on('touchmove', function(event){
                event.preventDefault();
                /*var x = event.originalEvent.touches[0].clientX;
                var y = event.originalEvent.touches[0].clientY;
                move(x, y);*/
                
                /* Found this on stackOverFlow for using touchleave */
                event = event.originalEvent;
  
                function _isInBounds(touch, elemposition, width, height){
                    var left = elemposition.left,
                    right = left + width,
                    top = elemposition.top,
                    bottom = top + height,
                    touchX = touch.pageX,
                    touchY = touch.pageY;
                    
                    return (touchX > left && touchX < right && touchY > top && touchY < bottom);
                };
                for(var i = 0; i < event.touches.length; i++){
                   var x = event.touches[i].clientX;
                   var y = event.touches[i].clientY;
                   move(x,y);
                }
            });
        }
        // fallback to clicks
        else {
            this.on('mousedown', function(event){
                down(event.clientX, event.clientY);
            });
            this.on('mouseout', function(event){
                exit();
            });
            this.on('mousemove', function(event){
                move(event.clientX, event.clientY);
            });
            this.on('mouseup', function(event){
                up();
            });
        }
    }
}

// Attach to load event so that we know jquery load first
window.addEventListener('load', function(){
    addTappableJQPlugin();
});
