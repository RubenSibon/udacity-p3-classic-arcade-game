/* TO DO:
    - Add gems;
    - Add scoring;
    - Add levels that increase difficulty by:
        - letting enemies come from the left and the right,
        - letting enemies bounce off eachother when coming from different directions,
        - allowing for more enemies at a time,
        - randomly generating more enemies;
*/

// Constants
var TILE_WIDTH = 101;
var TILE_HEIGHT = 83;
var PLAYER_START_X = 101 * 2;
var PLAYER_START_Y = 84 * 5 - 30;
var PLAYER_WIDTH = 58;
var PLAYER_HEIGHT = 58;
var PLAYER_X_OFFSET = 22;
var PLAYER_Y_OFFSET = 85;
var BUG_WIDTH = 80;
var BUG_HEIGHT = 64;
var BUG_X_OFFSET = 15;
var BUG_Y_OFFSET = 80;


// TO DO: Game object so to allow for scoring and levels. At a later point the game's state could be saved (TO DO).
var level = 1; // Level number is also a difficulty parameter.
var score = 0;

// TO DO: Function for completing a level.
// var winLevel = function() {
//     window.score += this.level;
//     window.level++;
//     loadNextLevel();
// }


// Random number generators. From Mozilla Developer Network (MDN). Possibly move into separate library later.
// Get a floating point number between two values (excluding max value).
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// Get an integer between and including two values.
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Define objects in the game that have a position, can move and collide. Render method draws all children.
var GameObject = function() {};

GameObject.prototype.render = function() {
    if (player.countDown > 0 && player.levelWon === true) {
        player.countDown--;
        ctx.drawImage(Resources.get('images/Selector.png'), player.x, player.y);
    } else if (player.countDown <= 0 && player.levelWon === true) {
        player.levelWon = false;
        player.countDown = 100;
    }

    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

    // DEBUG: Draw rectangles around moving objects for collision debugging. Uncomment to show.
    // ctx.beginPath();
    // ctx.rect(this.x + this.x_offset, this.y + this.y_offset, this.width, this.height);
    // ctx.lineWidth = 3;
    // ctx.strokeStyle = 'red';
    // ctx.stroke();
};

GameObject.prototype.update = function() {
    if (player.countDown > 0 && player.levelInit === true) {
        player.countDown--;
        player.x = PLAYER_START_X;
        player.y = PLAYER_START_Y;
    } else if (player.countDown <= 0 && player.levelInit === true) {
        player.levelInit = false;
        player.countDown = 100;
    }

    this.winLevel();
};


// Super class for all objects that move over the road. A sub class of GameObject.
var RoadRunner = function() {};

RoadRunner.prototype = Object.create(GameObject.prototype);

// RoadRunners start randomly at either one of three lanes on the y-axis.
RoadRunner.prototype.randomLane = function(min, max) {
    var randomRow = getRandomIntInclusive(min, max);
    return randomRow;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
RoadRunner.prototype.update = function(dt, playerObj) {
    this.checkCollision(player);
    this.purge();
    this.x = this.x + (this.speed * dt);
}


// Enemies our player must avoid. A sub class of RoadRunner.
var Enemy = function() {
    this.lane = this.randomLane(1, 3); // Decide starting lane randomly for each bug.
    this.x = -101;
    this.y = TILE_HEIGHT * this.lane - 20;
    this.x_offset = BUG_X_OFFSET;
    this.y_offset = BUG_Y_OFFSET;
    this.width = BUG_WIDTH;
    this.height = BUG_HEIGHT;
    // On level 1 bug speed is either 100 x 1, 1.5 or 2 depending on the lane.
    switch(this.lane) {
    case 1:
        this.speed = (0.5 + level) * 100;
        break;
    case 2:
        this.speed = (1 + level) * 100;
        break;
    case 3:
        this.speed = (0 + level) * 100;
        break;
    default: this.speed = 100;
    }
    this.sprite = 'images/enemy-bug.png';
};

Enemy.prototype = Object.create(RoadRunner.prototype);

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.purge = function() {
    // Remove instances of enemy from the game once out of sight
    if (this.x > 100 * 5) {
        var i = allEnemies.indexOf(this);
        if (i != -1) {
        	allEnemies.splice(i, 1);
        }
    }
}

Enemy.prototype.checkCollision = function(playerObj) {
    if ((playerObj.x + playerObj.x_offset) < (this.x + this.x_offset) + BUG_WIDTH &&
        (playerObj.x + playerObj.x_offset) + PLAYER_WIDTH > (this.x + this.x_offset) &&
        (playerObj.y + playerObj.y_offset) < (this.y + this.y_offset) + BUG_HEIGHT &&
        PLAYER_HEIGHT + (playerObj.y + playerObj.y_offset) > (this.y + this.y_offset)) {

            console.log("Vlogger is hit! Reloading...");
            window.setTimeout(player.hurt(1), 750);

    }
};


// Player object
var Player = function(x, y) {
    this.x = x;
    this.y = y;
    this.x_offset = PLAYER_X_OFFSET;
    this.y_offset = PLAYER_Y_OFFSET;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.sprite = 'images/char-boy.png';
    this.maxHearts = 3;
    this.hearts = this.maxHearts;
    this.countDown = 200;
    this.levelWon = false;
}

Player.prototype = Object.create(GameObject.prototype);

Player.prototype.handleInput = function(input) {
    if (input === 'up' && this.y > 0) {;
        return this.y -= TILE_HEIGHT;
    }
    if (input === 'right' && this.x < TILE_WIDTH * 4) {
        return this.x += TILE_WIDTH;
    }
    if (input === 'down' && this.y < TILE_HEIGHT * 4) {
        return this.y += TILE_HEIGHT;
    }
    if (input === 'left' && this.x > 0) {
        return this.x -= TILE_WIDTH;
    }
};

Player.prototype.hurt = function(damage) {
    this.hearts -= damage;
    console.log("Hearts: " + this.hearts);
    if (this.hearts <= 0) {
        this.die();
    } else {
        this.restart();
    }
}

Player.prototype.die = function() {
    this.hearts = this.maxHearts;
    console.log("Vlogger has been killed in action. Watich it now on Live Stream!");
    console.log("Hearts: " + this.hearts);
    window.setTimeout(this.restart(), 750); // TO DO: Show GAME OVER screen.
}

Player.prototype.winLevel = function() {
    if (this.y < TILE_HEIGHT * 0) {
        this.levelWon = true;
        console.log("Vlogger reached the river!");
        this.hearts = this.maxHearts;
        console.log("Hearts: " + player.hearts);
        this.restart(); // TO DO: Advance to next level.
    }
}

Player.prototype.restart = function() {
    this.levelInit = true;
    this.x = PLAYER_START_X;
    this.y = PLAYER_START_Y;
    allEnemies = [];
}


// Instantiate all game objects.
var allEnemies = [];

// Produce new enemy instances up to a maxium number.
(function() {
    var maxEnemyCount = Math.round(6 + (level / 10));

    window.setInterval(newEnemyInstance, 800);

    function newEnemyInstance() {
        if (allEnemies.length < maxEnemyCount) {
            var enemy = new Enemy();
            allEnemies.push(enemy);
        }
    }
}());

allEnemies.forEach(function(enemy) {
    enemy.update(player);
});


var player = new Player(PLAYER_START_X, PLAYER_START_Y);


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
