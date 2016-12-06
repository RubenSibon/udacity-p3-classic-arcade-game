var Game = (function() {
    'use strict';

    /**
     * TODO: Complete game with following features:
     *  - Add HUD with heart en gem icons.
     *  - Add three different gem types with varying values.
     *  - Animate player when hurt (fade in-out) and dying (turn 90 degrees).
     *  - Add levels that increase difficulty by:
     *      - having bigger maps and different obstacles on it,
     *      - making some levels time based,
     *      - letting enemies also come from the right,
     *      - allowing for more enemies at a time,
     *      - randomly generating more enemies;
     *  - Add START screen with character select.
     *  - Add GAME OVER screen.
     *  - Allow game to be saved (i.e. current level, score, life).
     *  - Add highscoring.
     *  - Make game mobile friendly:
     *      - Allow listening for touch and swipe events,
     *      - Add virtual arrow keys below map,
     *      - Make it more responsive, especially for retina displays.
     */

    /**
     * Game constants
     */
    var MAP_WIDTH = 505,
        MAP_HEIGHT = 606,
        NUM_ROWS = 6,
        NUM_COLS = 5,
        TILE_WIDTH = MAP_WIDTH / NUM_COLS, // 101
        TILE_HEIGHT = (MAP_HEIGHT - 101) / NUM_COLS - 18, // 83 (minus 18 because of sprite overlap)
        PLAYER_START_X = TILE_WIDTH * 2, // Column 3
        PLAYER_START_Y = TILE_HEIGHT * 5 - 30, // Row 6
        PLAYER_BOX_X_OFFSET = 22, // Offsets define sprite bounding boxes' top left point
        PLAYER_BOX_Y_OFFSET = 85,
        PLAYER_BOX_WIDTH = 58,
        PLAYER_BOX_HEIGHT = 58,
        BUG_BOX_X_OFFSET = 15,
        BUG_BOX_Y_OFFSET = 80,
        BUG_BOX_WIDTH = 80,
        BUG_BOX_HEIGHT = 64,
        GEM_BOX_X_OFFSET = 5,
        GEM_BOX_Y_OFFSET = 65,
        GEM_BOX_WIDTH = 90,
        GEM_BOX_HEIGHT = 90;

    /**
     * Game functions
     */
    // Halts synchronous execution for given time in milliseconds.
    // Contrast with built-in setTimeout function that runs asynchronously.
    function sleep(miliseconds) {
        var currentTime = new Date().getTime();
        while (currentTime + miliseconds >= new Date().getTime()) {}
    }

    /**
     * Two random number generators. Possibly move into separate library later.
     * Source: MDN (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)
     */
    // A: Get a floating point number between two values (excluding max value).
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    // B: Get an integer between and including two values.
    function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * @description Define Heads Up Display (HUD).
     * @constructor
     * TODO: Create HUD to display life and gems of player.
     */
    var Hud = function() {};
    Hud.prototype.renderHearts = function() {};
    Hud.prototype.renderScore = function() {};

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

    // Rendering for ALL game objects (children of GameObject) happens here.
    GameObject.prototype.render = function() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);

        ctx.font = 'italic 24px Bungee, cursive';
        ctx.fillStyle = '#e2e';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 1;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.fillText('Score : ' + player.gameScore, 11, 30);

        ctx.font = 'italic 24px Bungee, cursive';
        ctx.fillStyle = '#d33';
        ctx.fillText('Hearts : ' + player.hearts, 161, 30);

        if (player.levelWin === true) {
            ctx.font = 'italic 28px Bungee, cursive';
            ctx.fillStyle = 'gold';
            ctx.fillText('We have a wet vlogger!', 60, 450);
            ctx.fillText('Worth millions of views!', 35, 500);
        }
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // DEBUG CODE: Draw rectangles around objects for collision debugging. Uncomment to show.
        ctx.beginPath();
        ctx.rect(this.x + this.x_offset, this.y + this.y_offset, this.width, this.height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'red';
        ctx.stroke();
    };

    //
    /**
     * @description Prototypal object for all things that move over the road. Inherits from and extends GameObject.
     * @constructor
     * @param [number] Lane of Vehicle instance
     */
    var Vehicle = function() {
        GameObject.call(this, x, y, xoffset, yoffset, width, height);
        this.lane = 0;
    };
    Vehicle.prototype = Object.create(GameObject.prototype);
    Vehicle.prototype.constructor = Vehicle;

    // Vehicles start randomly at either one of three lanes on the y-axis.
    Vehicle.prototype.randomLane = function(min, max) {
        var randomRow = getRandomIntInclusive(min, max);
        return randomRow;
    };

    // Return a random lane for object to travel on.
    Vehicle.prototype.laneLogic = function() {
        this.lane = this.randomLane(1, 3); // Decide starting lane randomly.
        var startLane = TILE_HEIGHT * this.lane - 24;
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
            this.speed = (0.5 + player.gameLevel) * 100;
            return this.speed;
        } else if (this.y === TILE_HEIGHT * 2 - 20) {
            this.speed = (1 + player.gameLevel) * 100;
            return this.speed;
        } else if (this.y === TILE_HEIGHT * 3 - 20) {
            this.speed = (1 + player.gameLevel) * 100;
            return this.speed;
        } else {
            return 100;
        }
    };

    Vehicle.prototype.checkCollision = function(playerObj) {
        if ((playerObj.x + playerObj.x_offset) < (this.x + this.x_offset) + this.width &&
            (playerObj.x + playerObj.x_offset) + playerObj.width > (this.x + this.x_offset) &&
            (playerObj.y + playerObj.y_offset) < (this.y + this.y_offset) + this.height &&
            playerObj.width + (playerObj.y + playerObj.y_offset) > (this.y + this.y_offset)) {
            if (this.type === "Bug") {
                playerObj.hurt(1);
            } else if (this.type === "Gem") {
                playerObj.collectGem(this, this.variant);
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
     * @param [number] gameLevel - What level is the player on?
     * @param [boolean] levelWin - Has a level been won?
     * @param [number] gameScore - What is the player score?
     */
    var Player = function(x, y, xoffset, yoffset, width, height) {
        GameObject.call(this, x, y, xoffset, yoffset, width, height);
        this.sprite = 'images/char-boy.png';
        this.maxHearts = 3;
        this.hearts = this.maxHearts;

         // Game variables
        this.gameLevel = 1;
        this.levelWin = false;
        this.gameScore = 0;
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

    // Set player character back to start position and remove all other objects.
    Player.prototype.restart = function() {
        this.x = PLAYER_START_X;
        this.y = PLAYER_START_Y;
        allGems = [];
    };

    // Increase score and remove collectibles (like gems) once touched by a character.
    Player.prototype.collectGem = function(theGem, variant) {
        var i = allGems.indexOf(theGem);
        if (i !== -1) {
            allGems.splice(i, 1);
        }
        if (variant === "Blue") {
            this.increaseScore(1);
        }
    };

    Player.prototype.hurt = function(damage) {
        this.hearts -= damage;
        sleep(500);
        // console.log('Hearts: ' + this.hearts);
        if (this.hearts <= 0) {
            this.die();
        } else {
            this.restart();
        }
    };

    Player.prototype.die = function() {
        this.gameScore = 0;
        sleep(2000);
        this.hearts = this.maxHearts;
        this.restart(); // TODO: Show GAME OVER screen.
    };

    Player.prototype.winLevel = function() {
        this.levelWin = true;
        this.gameScore++;
        sleep(2000);
        this.hearts = this.maxHearts;
        this.restart(); // TODO: Advance to next level.
    };

    Player.prototype.advanceLevel = function() {
        // TODO: Advance to next level logic.
        this.gameLevel++;
    };

    Player.prototype.increaseScore = function(ammount) {
        // TODO: Display score on HUD. For log to console.
        this.gameScore += ammount;
        // console.log('Score: ' + this.gameScore);
    };

    Player.prototype.update = function(dt) {
        // Complete level condition.
        if (this.y < TILE_HEIGHT * 0) {
            this.winLevel();
        }
    };

    // Instantiate all game objects.
    var allEnemies = [],
        allGems = [],
        player = new Player(
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
            var spawnX = getRandomArbitrary(-101, 401);
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

        var maxEnemyCount = Math.round(5 + (player.gameLevel / 2)),
            maxGemCount = 2;

        setInterval(newEnemyInstance, 800);
        setInterval(newGemInstance, 2000);

        function newEnemyInstance() {
            var enemyChance = getRandomIntInclusive(1, 4);
            if (allEnemies.length < maxEnemyCount && enemyChance > 0 < 4) {
                var enemy = new Enemy(
                    'Bug',
                    'Red', -101,
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

        function newGemInstance() {
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

    /* Assign the instantiated objects to the global variable so that
     * they can be accessed by the engine.js script.
     */
    window.allEnemies = allEnemies;
    window.allGems = allGems;
    window.player = player;
})();
