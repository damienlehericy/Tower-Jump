'use strict';
//Define Canvas && path for assets
const CANVAS_HEIGHT = window.innerHeight;
const CANVAS_WIDTH = window.innerWidth;

const game = new Phaser.Game(CANVAS_WIDTH, CANVAS_HEIGHT, Phaser.CANVAS, 'game_div'),
	assets = {
		sprite : "./assets/sprites/",
		sounds : "./assets/sounds/"
	};

// Create the game state
const main_state = {

	preload: function () {
		// Load BG
		this.game.load.image('background', assets.sprite + 'buildingOne.png');

		// Load characters spritesheets (name, path, size)
		this.game.load.spritesheet('hero', assets.sprite + 'hero_spritesheet.png', 45, 45);
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

	create: function () {

		// Define global objects
		this.style  = {
			textUI : {
				font: "28px Rancho",
				fill: "#fff"
			}
		};
		this.animProperties = {
			hero : {
				frameRate : 6
			}
		};
		this.gameKeys = {
			right  : game.input.keyboard.addKey(Phaser.Keyboard.D),
			left   : game.input.keyboard.addKey(Phaser.Keyboard.Q),
			shop   : game.input.keyboard.addKey(Phaser.Keyboard.B),
			pause  : game.input.keyboard.addKey(Phaser.Keyboard.P),
			restart: game.input.keyboard.addKey(Phaser.Keyboard.R)
		};

		this.cursors     = game.input.keyboard.createCursorKeys();
		this.ennemy      = {};
		this.lineNbr     = 3;
		this.pauseStatut = false;

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
		this.ennemies.createMultiple(9999, 'ennemy');

		// Create UI && dynamics variable of UI
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

		this.UI.inGame.lifeNbrUI    = this.game.add.text(60, 20, this.hero.health, this.style.textUI);
		this.UI.inGame.scoreNbrUI   = this.game.add.text(330, 20, this.score, this.style.textUI);

		// Add interactions with UI buttons
		this.UI.inGame.menuButtonUI.inputEnabled    = true;
		this.UI.inGame.lifeButtonUI.inputEnabled    = true;
		this.UI.inGame.restartButtonUI.inputEnabled = true;

		this.UI.inGame.menuButtonUI.input.useHandCursor    = true;
		this.UI.inGame.lifeButtonUI.input.useHandCursor    = true;
		this.UI.inGame.restartButtonUI.input.useHandCursor = true;

		// Background scroll (Hero speed move illusion)
		this.bgTile.body.velocity.y = -200;

		// timer for add ennemy
		this.timer = this.game.time.events.loop(
			1000,
			this.add_row_of_ennemies,
			this
		);
	},

	update: function () {
		// Do right && left movement
		if (this.cursors.left.isDown || this.gameKeys.left.isDown) {
			this.hero.animations.stop();
			this.hero.x = this.hero.x - 5;
		} else if (this.cursors.right.isDown || this.gameKeys.right.isDown) {
			this.hero.animations.stop();
			this.hero.x = this.hero.x + 5;
		} else {
			this.hero.animations.play('stand', this.animProperties.hero.frameRate, true);
		}

		// Pause statut
		this.UI.inGame.menuButtonUI.events.onInputDown.add(this.pause_game, this);
		this.gameKeys.pause.onDown.add(this.pause_game, this);

		// Shop
		this.UI.inGame.lifeButtonUI.events.onInputDown.add(this.buy_life, this);
		this.gameKeys.shop.onDown.add(this.buy_life, this);

		// Restart game
		this.UI.inGame.restartButtonUI.events.onInputDown.add(this.restart_game, this);
		this.gameKeys.restart.onDown.add(this.restart_game, this);

		// Check Life
		if (this.hero.health <= 0) {
			this.game_over();
		}

		if (this.hero.alive === false) {
			this.restart_game();
		}

		// Drain life, if without world
		if (this.hero.inWorld === false) {
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
		this.UI.inGame.scoreNbrUI.content = this.score + "¥";
		this.UI.inGame.lifeNbrUI.content  = this.hero.health;
	},

	add_one_ennemy: function (x, y) {
		// first dead ennemy of our group
		this.ennemy = this.ennemies.getFirstDead();

		// new position of ennemy
		this.ennemy.reset(x, y);

		// Animate ennemy
		this.ennemy.animations.add('stand', [0, 1]);
		this.ennemy.animations.play('stand', 10, true);

		// Move to top
		this.ennemy.body.velocity.y = -260;

		// Kill ennemy when he disapear
		this.ennemy.outOfBoundsKill = true;
	},

	// Add row of ennemies (nbrEnnemy, margin, size of line)
	add_row_of_ennemies: function () {
		var hole = Math.floor(Math.random() * 9) + 1,
			birdNbr = Math.floor(Math.random() * 6) + 1,
			i;

		for (i = 0; i < birdNbr; i += 1) {
			if (i !== hole && i !== hole + 2) {
				this.add_one_ennemy(i * 70 + -15, 490);
			}
		}

		this.score += 1;
	},

	hit_ennemy: function () {
		// Define health after each hit
		this.hero.health = this.hero.health - 1;

		if (this.hero.health < 0) {
			this.hero.health = 0;
		}

		if (!this.sounds.effects.kick.isPlaying || !this.sounds.effects.bird.isPlaying) {
			if (this.sounds.effects.bird.totalDuration > 0) {
				this.sounds.effects.bird.stop();
				this.sounds.effects.bird.play();
			} else {
				this.sounds.effects.kick.play();
				this.sounds.effects.bird.play();
			}
		}
	},

	buy_life: function () {
		if (this.score >= 5) {
			this.score = this.score - 5;
			this.hero.health = this.hero.health + 1;
		}
	},

	game_over : function () {
		this.hero.body.gravity.y = 18000;

		// stop music && start game over song
		this.sounds.music.background.stop();
		this.sounds.music.pause.stop();
		this.sounds.effects.kick.stop();

		// Prevent new ennemies from appearing
		this.game.time.events.remove(this.timer);

		if (this.hero.inWorld === false) {
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
