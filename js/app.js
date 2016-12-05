/**
 * TODO: Complete game with following features:
 *  - Add HUD with heart en gem icons.
 *  - Add three different gem types with varying values.
 *  - Animate player when hurt (fade in-out) and dying (turn 90 degrees).
 *  - Add levels that increase difficulty by:
 *      - having bigger maps and different obstacles on it,
 *      - letting enemies come from left and right,
 *      - allowing for more enemies at a time,
 *      - randomly generating more enemies;
 *  - Add START screen with character select.
 *  - Add GAME OVER screen.
 */

/**
 * Constants
 */
var MAP_WIDTH = 505;
var MAP_HEIGHT = 606;
var TILE_WIDTH = 101;
var TILE_HEIGHT = 83;
var PLAYER_START_X = 101 * 2;
var PLAYER_START_Y = 84 * 5 - 30;
var PLAYER_BOX_X_OFFSET = 22; // Coordinate offsets define sprite bounding boxes.
var PLAYER_BOX_Y_OFFSET = 85;
var PLAYER_BOX_WIDTH = 58;
var PLAYER_BOX_HEIGHT = 58;
var BUG_BOX_X_OFFSET = 15;
var BUG_BOX_Y_OFFSET = 80;
var BUG_BOX_WIDTH = 80;
var BUG_BOX_HEIGHT = 64;
var GEM_BOX_X_OFFSET = 0;
var GEM_BOX_Y_OFFSET = 60;
var GEM_BOX_WIDTH = 100;
var GEM_BOX_HEIGHT = 100;

/**
 * Global variables
 */
var gameLevel = 1;
var levelWin = false;
var gameScore = 0;

/**
 * Global functions
 */
// Set player character back to start position and remove all other objects.
var restart = function() {
    player.x = PLAYER_START_X;
    player.y = PLAYER_START_Y;
    allGems = [];
};

var advanceLevel = function() {
    // TODO: Advance to next level logic.
    gameLevel ++;
};

var increaseScore = function(ammount) {
    // TODO: Display score on HUD. For log to console.
    gameScore += ammount;
    console.log('Score: ' + gameScore);
};

// TODO: Create HUD to display life and gems of player.
var Hud = function() {};
Hud.prototype.renderHearts = function() {};
Hud.prototype.renderScore = function() {};

/**
 * Two random number generators. Possibly move into separate library later.
 * Source: MDN (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)
 */
// A: Get a floating point number between two values (excluding max value).
function getRandomArbitrary (min, max) {return Math.random() * (max - min) + min;}

// B: Get an integer between and including two values.
function getRandomIntInclusive (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @description Define primal game object that has the base properties.
 * @constructor
 * @param [number] x - The x coordinate of the object
 * @param [number] y - The y coordinate of the object
 * @param [number] xoffset - The left side of object's bounding box
 * @param [number] yoffset - The top side of object's bounding box
 * @param [number] width - The width of the object
 * @param [number] height - The height of the object
 */
var GameObject = function(x, y, xoffset, yoffset, width, height) {
    this.x = x;
    this.y = y;
    this.x_offset = xoffset;
    this.y_offset = yoffset;
    this.width = width;
    this.height = height;
};

// Increase score and remove collectibles (like gems) once touched by a character.
GameObject.prototype.collectGem = function(theGem, variant) {
    var i = allGems.indexOf(theGem);
    if (i !== -1) {
        allGems.splice(i, 1);
    }
    if (variant === "Blue") {
        increaseScore(1);
    }
};

// Rendering for ALL game objects (children of GameObject) happens here.
GameObject.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

    ctx.font = 'italic 24px Sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText('Score : ' + window.gameScore, 10, 30);

    ctx.font = 'italic 24px Sans-serif';
    ctx.fillStyle = 'red';
    ctx.fillText('Hearts : ' + player.hearts, 311, 30);

    if (levelWin === true) {
        ctx.font = 'italic 32px Georgia, serif';
        ctx.fillStyle = 'gold';
        ctx.fillText('We have a wet vlogger!', 60, 450);
        ctx.fillText('Worth millions of viewers!', 40, 500);
    }

    // DEBUG CODE: Draw rectangles around objects for collision debugging. Uncomment to show.
    // ctx.beginPath();
    // ctx.rect(this.x + this.x_offset, this.y + this.y_offset, this.width, this.height);
    // ctx.lineWidth = 3;
    // ctx.strokeStyle = 'red';
    // ctx.stroke();
};

GameObject.prototype.update = function(dt) {
    // Complete level condition.
    if (player.y < TILE_HEIGHT * 0) {
        player.winLevel();
    }
};

//
/**
 * @description Prototypal object for all things that move over the road. Inherits from and extends GameObject.
 * @constructor
 */
var Vehicle = function() {
    GameObject.call(this, x, y, xoffset, yoffset, width, height);
};
Vehicle.prototype = Object.create(GameObject.prototype);

// Vehicles start randomly at either one of three lanes on the y-axis.
Vehicle.prototype.randomLane = function(min, max) {
    var randomRow = getRandomIntInclusive(min, max);
    return randomRow;
};

// Return a random lane for object to travel on.
Vehicle.prototype.laneLogic = function() {
    this.lane = Vehicle.prototype.randomLane(1, 3); // Decide starting lane randomly.
    var startLane = TILE_HEIGHT * this.lane - 20;
    return startLane;
};

// Return movement speed in accordance with lane. Each lane has it's own "speed limit".
Vehicle.prototype.laneDir = function(dt) {
    switch (this.dir) {
    case 'ltr':
        this.x = this.x + (this.speed * dt);
        return this.x;
    case 'rtl':
        this.x = this.x - (this.speed * dt);
        return this.x;
    default:
        this.x = this.x + (this.speed * dt);
        return this.x;
    }
};

// On level 1 bug speed is either 100 x 1, 1.5 or 2 depending on the lane.
Vehicle.prototype.speedCalc = function() {
    if (this.y === TILE_HEIGHT * 1 - 20) {
        this.speed = (0.5 + gameLevel) * 100;
        return this.speed;
    } else if (this.y ===  TILE_HEIGHT * 2 - 20) {
        this.speed = (1 + gameLevel) * 100;
        return this.speed;
    } else if (this.y ===  TILE_HEIGHT * 3 - 20) {
        this.speed = (1 + gameLevel) * 100;
        return this.speed;
    } else {
        return 100;
    }
};

Vehicle.prototype.checkCollision = function(playerObj) {
    if ((playerObj.x + playerObj.x_offset) < (this.x + this.x_offset) + this.width &&
        (playerObj.x + playerObj.x_offset) + player.width > (this.x + this.x_offset) &&
        (playerObj.y + playerObj.y_offset) < (this.y + this.y_offset) + this.height &&
        player.width + (playerObj.y + playerObj.y_offset) > (this.y + this.y_offset)) {
            if (this.type === "Bug") {
                player.hurt(1);
            } else if (this.type === "Gem") {
                GameObject.prototype.collectGem(this, this.variant);
            }
    }
};

// Remove vehicles from the array once they have left the map.
Vehicle.prototype.purge = function(typeOfVehicle) {
    if (this.x > 100 * 6 || this.x < -101) {
        var i = typeOfVehicle.indexOf(this);
        if (i !== -1) {
            typeOfVehicle.splice(i, 1);
        }
    }
};

// Update the enemy's position, required method for game.
// Parameter: dt, a time delta between ticks.
Vehicle.prototype.update = function(dt, playerObj) {
    this.checkCollision(player);
    this.purge(allEnemies);
    this.purge(allGems);
    this.laneDir(dt);
};

/**
 * @description Enemy prototype. Inherits from and extends Vehicle.
 * @constructor
 * @param [string] type - Type of enemy
 * @param [string] variant - Variants of the enemy type
 * @param [string] dir - Direction (ltr or rtl) that the enemy travels in
 * @param [number] speed - Speed at which the enemy travels
 * @param [string] sprite - Reference to the enemy's image
 */
var Enemy = function(type, variant, x, y, xoffset, yoffset, width, height, dir) {
    this.type = type;
    this.variant = variant;
    GameObject.call(this, x, y, xoffset, yoffset, width, height);
    this.dir = dir;
    this.speed = this.speedCalc(); // 1, 1.5 or 2
    this.sprite = 'images/enemy-bug.png';
};
Enemy.prototype = Object.create(Vehicle.prototype);

/**
 * @description Gem prototype. Inherits from and extends Vehicle.
 * @constructor
 * @param [string] type - Type of gem
 * @param [string] variant - Variants of the gem type
 * @param [string] dir - Direction (ltr or rtl) that the gem travels in
 * @param [number] speed - Speed at which the gem travels
 * @param [string] sprite - Reference to the gem's image
 */
var Gem = function(type, variant, x, y, xoffset, yoffset, width, height, dir) {
    this.type = type;
    this.variant = variant;
    GameObject.call(this, x, y, xoffset, yoffset, width, height);
    this.dir = dir;
    this.speed = 200;
    this.sprite = 'images/Gem Blue.png';
};
Gem.prototype = Object.create(Vehicle.prototype);

/**
 * @description Player object. Inherits from and extends GameObject.
 * Has various methods that deal with the result of collision or position events.
 * @constructor
 * @param [string] sprite - Reference to the gem's image
 * @param [number] maxHearts - Maximum ammount of hearts that player can have
 * @param [number] hearts - Ammount of hearts that the player has
 */
var Player = function(x, y, xoffset, yoffset, width, height) {
    GameObject.call(this, x, y, xoffset, yoffset, width, height);
    this.sprite = 'images/char-boy.png';
    this.maxHearts = 3;
    this.hearts = this.maxHearts;
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
    player.hearts -= damage;
    console.log('Hearts: ' + player.hearts);
    if (player.hearts <= 0) {
        player.die();
    } else {
        restart();
    }
};

Player.prototype.die = function() {
    console.log('Vlogger has been killed in action. Watich it now on Live Stream!\n\nScore reset.');
    gameScore = 0;
    this.hearts = this.maxHearts;
    restart(); // TODO: Show GAME OVER screen.
};

Player.prototype.winLevel = function() {
    gameScore++;
    this.hearts = this.maxHearts;
    levelWin = true;
    restart(); // TODO: Advance to next level.
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
    // Spawn 3 bugs randomly on the roads at start to prevent player rushing to goal.
    for (var e = 0; e < 3; e++) {
        var spawnX = window.getRandomArbitrary(-101, 401);
        var spawnY = Enemy.prototype.laneLogic();
        var enemy = new Enemy(
            'Bug',
            'Red',
            spawnX,
            spawnY,
            BUG_BOX_X_OFFSET,
            BUG_BOX_Y_OFFSET,
            BUG_BOX_WIDTH,
            BUG_BOX_HEIGHT,
            'ltr'
        );
        allEnemies.push(enemy);
    }

    var maxEnemyCount = Math.round(6 + (gameLevel / 2));
    var maxGemCount = 2;

    window.setInterval(newEnemyInstance, 800);
    window.setInterval(newGemInstance, 2000);

    function newEnemyInstance () {
        if (allEnemies.length < maxEnemyCount) {
            var enemy = new Enemy(
                'Bug',
                'Red',
                -101,
                Vehicle.prototype.laneLogic(),
                BUG_BOX_X_OFFSET,
                BUG_BOX_Y_OFFSET,
                BUG_BOX_WIDTH,
                BUG_BOX_HEIGHT,
                'ltr'
            );
            allEnemies.push(enemy);
            // console.log('Enemies on map: ' + allEnemies.length);
        }
    }

    function newGemInstance () {
        // There is a 1 in 3 chance that a new gem appears every 3 seconds.
        var gemChance = getRandomIntInclusive(1, 4);
        if (allGems.length < maxGemCount && gemChance === 1) {
            var gem = new Gem(
                'Gem',
                'Blue',
                MAP_WIDTH,
                Vehicle.prototype.laneLogic(),
                GEM_BOX_X_OFFSET,
                GEM_BOX_Y_OFFSET,
                GEM_BOX_WIDTH,
                GEM_BOX_HEIGHT,
                'rtl'
            );
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
