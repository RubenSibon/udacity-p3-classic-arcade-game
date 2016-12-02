/* TO DO:
    - Add gems;
    - Add scoring;
    - Add math functions for all moving objects;
    - Add levels that increase difficulty by:
        - letting enenmies come from the left and the right,
        - allowing for more enemies at a time,
        - randomly generating them more often;
*/

// Constants
var TILE_WIDTH = 100;
var TILE_HEIGHT = 83;
var X_START_LOC = 101 * 2;
var Y_START_LOC = 83 * 5 - 30;
var PLAYER_WIDTH = 64;
var PLAYER_HEIGHT = 64;
var BUG_WIDTH = 100;
var BUG_HEIGHT = 65;


// Math functions from Mozilla Developer Network
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



// Game object so to allow for scoring and levels. At a later point the game's state could be saved (TO DO).
var Game = function() {
    this.level = 1; // Level number is also the difficulty parameter.
    this.score = 0;
}

Game.prototype.winLevel = function() {
    this.score += this.level;
    this.level++;
    reset();
}



// Define super class objects in the game that have a position, can move and collide.
var GameObject = function() {
}

GameObject.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

    ctx.beginPath();
    ctx.rect(this.x + this.xoffset, this.y + this.yoffset, this.width, this.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'red';
    ctx.stroke();
};



// Super class for all objects that move over the road. A sub class of GameObject.
var RoadRunner = function() {};

RoadRunner.prototype = Object.create(GameObject.prototype);

// RoadRunners start randomly at either one of three lanes on the y-axis.
RoadRunner.prototype.startLane = function(min, max) {
    var randRow = getRandomIntInclusive(min, max);
    return TILE_HEIGHT * randRow - 20;
};


// Enemies our player must avoid. A sub class of RoadRunner.
var Enemy = function() {
    this.x = -101;
    this.y = this.startLane(1, 3);
    this.xoffset = 0;
    this.yoffset = 80;
    this.width = BUG_WIDTH;
    this.height = BUG_HEIGHT;
    this.speed = (getRandomIntInclusive(2,4) / 2) * 100;
    this.sprite = 'images/enemy-bug.png';
};

Enemy.prototype = Object.create(RoadRunner.prototype);

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    this.checkCollision(player);

    this.x = this.x + (this.speed * dt);

    // Remove instances of enemy from the game once out of sight
    if (this.x > 100 * 4) {
        var i = allEnemies.indexOf(this);
        if(i != -1) {
        	allEnemies.splice(i, 1);
        }
    }

}

Enemy.prototype.checkCollision = function(playerObj) {
    if (playerObj.x < this.x + BUG_WIDTH &&
        playerObj.x + PLAYER_WIDTH > this.x &&
        playerObj.y < this.y + BUG_HEIGHT &&
        PLAYER_HEIGHT + playerObj.y > this.y) {
        //player.reset();
        console.log("Collision!");
    }
};

;

// Player object
var Player = function(x, y) {
    this.x = x;
    this.y = y;
    this.xoffset = 20;
    this.yoffset = 80;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.sprite = 'images/char-boy.png';
}

Player.prototype = Object.create(GameObject.prototype);

Player.prototype.update = function() {};

Player.prototype.handleInput = function(input) {
    if (input === 'up' && this.y > 0) {
        this.y -= TILE_HEIGHT;
    }
    if (input === 'right' && this.x < TILE_WIDTH * 4) {
        this.x += TILE_WIDTH;
    }
    if (input === 'down' && this.y < TILE_HEIGHT * 4) {
        this.y += TILE_HEIGHT;
    }
    if (input === 'left' && this.x > 2) {
        this.x -= TILE_WIDTH;
    }
};



// Instantiate objects.
var allEnemies = [];

var enemy = allEnemies.push(new Enemy());

var enemyGenerator = function() {
    var maxEnemyCount = 4;

    window.setInterval(newEnemyInstance, 800);

    function newEnemyInstance() {
        if (allEnemies.length < maxEnemyCount) {
            var enemy = new Enemy();
            allEnemies.push(enemy);
        }
    }

};

enemyGenerator();

var player = new Player(X_START_LOC, Y_START_LOC);

allEnemies.forEach(function(enemy) {
    enemy.update(player);
});



// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
