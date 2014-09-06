// Initialize Phaser, and creates a 400x490px game
var game = new Phaser.Game(400, 490, Phaser.CANVAS, 'game_div');
    assets = {
        sprite : "assets/sprites/",
        sounds : "assets/sounds/"
    };

// Creates a new 'main' state that wil contain the game
var main_state = {

    preload: function() {
		// Background of game
        this.game.load.image('background', assets.sprite + 'buildingOne.png');

        // Load hero spritesheet (name, path, size)
        this.game.load.spritesheet('hero', assets.sprite + 'hero_spritesheet.png', 45, 45);

        // Load ennemies
        this.game.load.spritesheet('ennemy', assets.sprite + 'bird_spritesheet.png', 60, 60);

        // Load UI
        this.game.load.image('lifeUI', assets.sprite + 'life.png');
        this.game.load.image('coinUI', assets.sprite + 'coin.png');
        this.game.load.image('menuWindowUI', assets.sprite + 'menu.png');
        this.game.load.image('menuButtonUI', assets.sprite + 'menu_button.png');
        this.game.load.image('lifeButtonUI', assets.sprite + 'life_button.png');
        this.game.load.image('restartButtonUI', assets.sprite + 'restart_button.png');

        // Load audio
        this.game.load.audio('bird_cry', assets.sounds + 'bird_cry.wav');
        this.game.load.audio('japan_fanfare', assets.sounds + 'japan_fanfare.wav');
        this.game.load.audio('town_morning', assets.sounds + 'town_morning.wav');
        this.game.load.audio('kick', assets.sounds + 'kick.wav');
    },

    create: function() {

        // Define global objects
        var style  = {
                textUI : {
                    font: "28px Terminal", fill: "#fff"
                }
            };
            animProperties = {
                hero : {
                    frameRate : 6
                }
            };
            gameKeys = {
                shop   : game.input.keyboard.addKey(Phaser.Keyboard.B),
                pause  : game.input.keyboard.addKey(Phaser.Keyboard.P),
                restart: game.input.keyboard.addKey(Phaser.Keyboard.R)
            };
            cursors     = game.input.keyboard.createCursorKeys();
            ennemy      = {};
            lineNbr     = 3;
            pauseStatut = false;

        // Add background
        this.bgTile = this.game.add.tileSprite(0, 0, game.stage.bounds.width, 490, 'background');

        // Add songs in game
        this.sounds = {
            music   : {
                background : this.game.add.audio('town_morning'),
                pause      : this.game.add.audio('japan_fanfare')
            },
            effects : {
                bird : this.game.add.audio('bird_cry'),
                dead : this.game.add.audio('game_over'),
                kick : this.game.add.audio('kick')
            }
        };

        this.sounds.music.background.play('', 1, true, true);

    	// Create hero with animation
        this.hero = this.game.add.sprite(175, 100, 'hero');
        this.hero.animations.add('stand', [0, 1]);

        // Create group of ennemies
        this.ennemies = game.add.group();
        this.ennemies.createMultiple(9999,'ennemy');

        // Create UI Object
        this.hero.health  = 3;
        this.score        = 0;

        this.UI = {
            inGame : {
                lifeUI          : this.game.add.sprite(20, 20, 'lifeUI'),
                coinUI          : this.game.add.sprite(360, 20, 'coinUI'),
                menuButtonUI    : this.game.add.sprite(130, 440, 'menuButtonUI'),
                lifeButtonUI    : this.game.add.sprite(290, 440, 'lifeButtonUI'),
                restartButtonUI : this.game.add.sprite(30, 440, 'restartButtonUI')
            }
        };

        this.UI.inGame.lifeNbrUI    = this.game.add.text(60, 20, this.hero.health, style.textUI);
        this.UI.inGame.scoreNbrUI   = this.game.add.text(330, 20, this.score, style.textUI);

        // Allow click on buttons
        this.UI.inGame.menuButtonUI.inputEnabled    = true;
        this.UI.inGame.lifeButtonUI.inputEnabled    = true;
        this.UI.inGame.restartButtonUI.inputEnabled = true;

        this.UI.inGame.menuButtonUI.input.useHandCursor    = true;
        this.UI.inGame.lifeButtonUI.input.useHandCursor    = true;
        this.UI.inGame.restartButtonUI.input.useHandCursor = true;

        // Pause statut
        this.UI.inGame.menuButtonUI.events.onInputDown.add(this.pause_game, this);
        gameKeys.pause.onDown.add(this.pause_game, this);

        // Shop
        this.UI.inGame.lifeButtonUI.events.onInputDown.add(this.buy_life, this);
        gameKeys.shop.onDown.add(this.buy_life, this);

        // Restart game
        this.UI.inGame.restartButtonUI.events.onInputDown.add(this.restart_game, this);
        gameKeys.restart.onDown.add(this.restart_game, this);

        // Gravity
        this.bgTile.body.velocity.y = -180;

        // timer for add ennemy
        this.timer = this.game.time.events.loop(
            1500,
            this.add_row_of_ennemies,
            this
        );
    },

    update: function() {
        // Cursors && Keyboard detection
        if (cursors.left.isDown)
        {
            this.hero.animations.stop();
            this.hero.x = this.hero.x - 5;
        }
        else if (cursors.right.isDown)
        {
            this.hero.animations.stop();
            this.hero.x = this.hero.x + 5;
        }
        else
        {
            this.hero.animations.play('stand', animProperties.hero.frameRate, true);
        }

        // Check Life
        if (this.hero.health <= 0) {
            this.game_over();
        }

        if (this.hero.alive == false) {
            this.restart_game();
        }

        // Drain life, if without world
        if (this.hero.inWorld == false) {
            this.hero.health = this.hero.health - 1;
        }

        // Collision detection
        this.game.physics.collide(
            this.hero,
            this.ennemies,
            this.hit_ennemy,
            null,
            this
        );

        this.hero.body.velocity.y = 0;

        this.bgTile.height = this.bgTile.height + 10;
        this.UI.inGame.scoreNbrUI.content = this.score + "¾";
        this.UI.inGame.lifeNbrUI.content  = this.hero.health;
    },

    add_one_ennemy: function (x, y) {
        // first dead ennemy of our group
        ennemy = this.ennemies.getFirstDead();

        // new position of ennemy
        ennemy.reset(x, y);

        // Animate ennemy
        ennemy.animations.add('stand', [0, 1]);
        ennemy.animations.play('stand', 10, true);

        // Move to top
        ennemy.body.velocity.y = -200;

        // Kill ennemy when he disapear
        ennemy.outOfBoundsKill = true;
    },

    add_row_of_ennemies: function () {
        var hole = Math.floor(Math.random() * 9) + 1,
            birdNbr = Math.floor(Math.random() * 8),
            i;

        for (i = 0; i < birdNbr; i += 1) {
            if (i != hole && i != hole + 3) {
                this.add_one_ennemy(i * 70 + -15, 490);
            }
        }
            
        this.score += 1;
    },

    hit_ennemy: function () {
        // Define health after each hit
        this.hero.health = this.hero.health - 1;

        if(this.hero.health < 0) {
            this.hero.health = 0;
        }

        this.sounds.effects.kick.stop();
        this.sounds.effects.bird.stop();

        this.sounds.effects.kick.play();
        this.sounds.effects.bird.play();
    },

    buy_life: function () {
        if(this.score >= 3) {
            this.score = this.score - 3;
            this.hero.health = this.hero.health + 1;
        }        
    },

    game_over : function () {
        this.hero.body.gravity.y = 20000;

        // stop music && start game over song
        this.sounds.music.background.stop();
        this.sounds.music.pause.stop();

        // Prevent new ennemies from appearing
        this.game.time.events.remove(this.timer);

        if (this.hero.inWorld == false) {
            this.hero.alive = false;
        }
    },

    pause_game: function () {
        if (game.paused) {
            game.paused = false;
            this.sounds.music.pause.stop();
            this.sounds.music.background.play('', 1, true, true);
        } else {
            game.paused = true;
            this.sounds.music.background.stop();
            this.sounds.music.pause.play('', 1, true, true);
        }
    },

    restart_game: function () {
        this.game.time.events.remove(this.timer);
        this.game.state.start('main');
    }
};

// Add and start the 'main' state to start the game
game.state.add('main', main_state);
game.state.start('main');
