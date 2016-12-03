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
// Coordinate offsets are used to calculate left-up corner of bounding boxes around sprites.
var MAP_WIDTH = 505;
var MAP_HEIGHT = 606;
var TILE_WIDTH = 101;
var TILE_HEIGHT = 83;
var PLAYER_START_X = 101 * 2;
var PLAYER_START_Y = 84 * 5 - 30;
var PLAYER_BOX_WIDTH = 58;
var PLAYER_BOX_HEIGHT = 58;
var PLAYER_BOX_X_OFFSET = 22;
var PLAYER_BOX_Y_OFFSET = 85;
var BUG_BOX_WIDTH = 80;
var BUG_BOX_HEIGHT = 64;
var BUG_BOX_X_OFFSET = 15;
var BUG_BOX_Y_OFFSET = 80;

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
function getRandomArbitrary (min, max) {
    return Math.random() * (max - min) + min;
}

// Get an integer between and including two values.
function getRandomIntInclusive (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Define objects in the game that have a position, can move and collide. Render method draws all children.
var GameObject = function(x, y, xoffset, yoffset, width, height) {
    this.x = x;
    this.y = y;
    this.x_offset = xoffset;
    this.y_offset = yoffset;
    this.width = width;
    this.height = height;
};

GameObject.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

    // DEBUG: Draw rectangles around moving objects for collision debugging. Uncomment to show.
    ctx.beginPath();
    ctx.rect(this.x + this.x_offset, this.y + this.y_offset, this.width, this.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'red';
    ctx.stroke();
};

GameObject.prototype.update = function() {
    this.winLevel();
};


// Super class for all objects that move over the road. A sub class of GameObject.
var RoadRunner = function() {
    this.lane = this.randomLane(1, 3); // Decide starting lane randomly for each bug.
    this.x = -101;
    this.y = TILE_HEIGHT * this.lane - 20;
};

RoadRunner.prototype = Object.create(GameObject.prototype);

// RoadRunners start randomly at either one of three lanes on the y-axis.
RoadRunner.prototype.randomLane = function(min, max) {
    var randomRow = getRandomIntInclusive(min, max);
    return randomRow;
};

// Remove RoadRunners like enemy bugs and gems from the array once outside of map.
RoadRunner.prototype.purge = function(typeOfRunner) {
    if (this.x > 100 * 5 || this.x < -101) {
        var i = typeOfRunner.indexOf(this);
        if (i !== -1) {
            typeOfRunner.splice(i, 1);
        }
    }
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
RoadRunner.prototype.update = function(dt, playerObj) {
    this.checkCollision(player);
    this.purge(allEnemies);
    this.purge(allGems);
    this.x = this.x + (this.speed * dt);
};


// Enemies our player must avoid. A sub class of RoadRunner.
var Enemy = function() {
    // Decide starting lane randomly for each bug.
    this.lane = this.randomLane(1, 3);
    this.x = -101;
    this.y = TILE_HEIGHT * this.lane - 20;
    this.x_offset = BUG_BOX_X_OFFSET;
    this.y_offset = BUG_BOX_Y_OFFSET;
    this.width = BUG_BOX_WIDTH;
    this.height = BUG_BOX_HEIGHT;
    // On level 1 bug speed is either 100 x 1, 1.5 or 2 depending on the lane.
    switch (this.lane) {
    case 1:
        this.speed = (0.5 + level) * 100;
        break;
    case 2:
        this.speed = (1 + level) * 100;
        break;
    case 3:
        this.speed = (0 + level) * 100;
        break;enemy-bug
    default: this.speed = 100;
    }
    this.sprite = 'images/enemy-bug.png';
};

Enemy.prototype = Object.create(RoadRunner.prototype);

Enemy.prototype.checkCollision = function(playerObj) {
    if ((playerObj.x + playerObj.x_offset) < (this.x + this.x_offset) + BUG_BOX_WIDTH &&
        (playerObj.x + playerObj.x_offset) + PLAYER_BOX_WIDTH > (this.x + this.x_offset) &&
        (playerObj.y + playerObj.y_offset) < (this.y + this.y_offset) + BUG_BOX_HEIGHT &&
        PLAYER_BOX_HEIGHT + (playerObj.y + playerObj.y_offset) > (this.y + this.y_offset)) {
            console.log('Vlogger is hit! Reloading...');
            window.setTimeout(player.hurt(1), 750);
    }
};

var Gem = function() {
    // Decide starting lane randomly for each gem.
    this.lane = this.randomLane(1, 3);
    this.x = MAP_WIDTH;
    this.y = TILE_HEIGHT * this.lane - 20;
    this.sprite = 'images/Gem Blue.png';
};

Gem.prototype = Object.create(RoadRunner.prototype);

// Player object
var Player = function(x, y, xoffset, yoffset, width, height) {
    this.x = x;
    this.y = y;
    this.x_offset = xoffset;
    this.y_offset = yoffset;
    this.width = width;
    this.height = height;
    this.sprite = 'images/char-boy.png';
    this.maxHearts = 3;
    this.hearts = this.maxHearts;
    this.countDown = 150;
    this.levelInit = true;
    this.levelWon = false;
};

Player.prototype = Object.create(GameObject.prototype);

Player.prototype.handleInput = function(input) {
    if (input === 'up' && this.y > 0) {
        var goUp = this.y -= TILE_HEIGHT;
        return goUp;
    }
    if (input === 'right' && this.x < TILE_WIDTH * 4) {
        var goRight = this.x += TILE_WIDTH;
        return goRight;
    }
    if (input === 'down' && this.y < TILE_HEIGHT * 4) {
        var goDown = this.y += TILE_HEIGHT;
        return goDown;
    }
    if (input === 'left' && this.x > 0) {
        var goLeft = this.x -= TILE_WIDTH;
        return goLeft;
    }
};

Player.prototype.hurt = function(damage) {
    this.hearts -= damage;
    // console.log('Hearts: ' + this.hearts);
    if (this.hearts <= 0) {
        this.die();
    } else {
        this.restart();
    }
};

Player.prototype.die = function() {
    this.hearts = this.maxHearts;
    console.log('Vlogger has been killed in action. Watich it now on Live Stream!');
    // console.log('Hearts: ' + this.hearts);
    window.setTimeout(this.restart(), 750); // TO DO: Show GAME OVER screen.
};

Player.prototype.winLevel = function() {
    if (this.y < TILE_HEIGHT * 0) {
        this.levelWon = true;
        if (player.countDown > 0 && player.levelWon === true) {
            player.countDown--;
            ctx.drawImage(Resources.get('images/Selector.png'), player.x, player.y);
        } else if (player.countDown <= 0 && player.levelWon === true) {
            player.levelWon = false;
            player.countDown = 150;
        }
        console.log('Vlogger reached the river!');
        this.hearts = this.maxHearts;
        // console.log('Hearts: ' + player.hearts);
        this.restart(); // TO DO: Advance to next level.
    }
};

Player.prototype.restart = function() {
    if (this.countDown > 0 && this.levelInit === true) {
        this.countDown--;
    } else if (this.countDown <= 0 && this.levelInit === true) {
        this.levelInit = false;
        this.countDown = 150;
    }
    this.x = PLAYER_START_X;
    this.y = PLAYER_START_Y;
    allEnemies = [];
};

// Instantiate all game objects.
var allEnemies = [];
var allGems = [];
var player = new Player(
    PLAYER_START_X,
    PLAYER_START_Y,
    PLAYER_BOX_X_OFFSET,
    PLAYER_BOX_Y_OFFSET,
    PLAYER_BOX_WIDTH,
    PLAYER_BOX_HEIGHT
);

// Produce new enemy and gem instances periodically up to a maximum number.
(function() {
    var maxEnemyCount = Math.round(5 + (level / 2));
    var maxGemCount = 2;

    window.setInterval(newEnemyInstance, 800);
    window.setInterval(newGemInstance, 3000);

    function newEnemyInstance () {
        if (allEnemies.length < maxEnemyCount) {
            var enemy = new Enemy();
            allEnemies.push(enemy);
            // console.log('Enemies on map: ' + allEnemies.length);
        }
    }

    function newGemInstance () {
        // There is a 1 in 3 chance that a new gem appears every 3 seconds.
        var gemChance = getRandomIntInclusive(1, 3);
        if (allGems.length < maxGemCount && gemChance === 1) {
            var gem = new Gem();
            allGems.push(gem);
            // console.log('Gems on map: ' + allGems.length);
        }
    }
}());


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
