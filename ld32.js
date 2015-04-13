/**
 * Sam Atkins' LD32 entry
 */

;

var canvas = document.getElementById("canvas");

var Game = {
	MAX_FRAME_TIME: 1000/30,

	context2d: canvas.getContext("2d"),
	width: canvas.width,
	height: canvas.height,
	keysPressed: {},
	oldKeysPressed: {},
	scene: new MenuScene(),
	images: {},
	sounds: {},
};
function wasKeyJustPressed(keycode) {
	return Game.keysPressed[keycode] && !Game.oldKeysPressed[keycode];
}

// Keyboard handling
window.onkeydown = function(e) {
	e = e || window.event;
	Game.keysPressed[e.keyCode] = true;
	e.preventDefault();
};
window.onkeyup = function(e) {
	e = e || window.event;
	delete Game.keysPressed[e.keyCode];
};

function MenuScene() {
	this.update = function(deltaTime) {

		// Go to play scene
		if (Game.keysPressed[32]) {
			Game.scene = new PlayScene();
			Game.sounds["jump"].play();
		}

		// Render text
		Game.context2d.font = "20px sans-serif";
		Game.context2d.fillStyle = "white";
		Game.context2d.textAlign = "center";
		Game.context2d.textBaseline = "middle";
		Game.context2d.fillText("LD32 game!", Game.width/2, 20);
		Game.context2d.fillText("Press Space to play!", Game.width/2, Game.height/3);
	};
}

function PlayScene() {
	this.update = function(deltaTime) {

		if (wasKeyJustPressed(32) && !this.ball.launched) { // SPACE / Fire
			// Launch the ball!
			this.ball.vy = -200;
			this.ball.vx = (Math.random() > 0.5) ? 200 : -200;
			this.ball.launched = true;

			Game.sounds["jump"].play();
		}

		this.updatePaddle(deltaTime, this.paddle);
		this.updateBall(deltaTime, this.ball);
		this.updateBricks(deltaTime);
	};

	this.ball = {
		image: Game.images["ball"],
		launched: false,

		x: Game.width/2,
		y: Game.height/2,
		w: 16,
		h: 16,

		vx: 0,
		vy: 0,
	};
	this.ball.w2 = this.ball.w/2;
	this.ball.h2 = this.ball.h/2;
	this.updateBall = function(deltaTime, ball) {
		if (ball.launched) {
			ball.x += ball.vx * deltaTime;
			ball.y += ball.vy * deltaTime;

			// Bounce off the paddle!
			if ((ball.y + ball.h2 >= this.paddle.y - this.paddle.h2)
				&& (ball.x + ball.w2 >= this.paddle.x - this.paddle.w2)
				&& (ball.x - ball.w2 <= this.paddle.x + this.paddle.w2)) {

				ball.vy = -ball.vy;
				ball.y = this.paddle.y - this.paddle.h2 - ball.h2 - 1;
			}

			// Bounce off bricks!
			for (var i = 0; i < this.bricks.length; i++) {
				// Continue work here! :D
				this.bricks[i]
			};

			// Bounce off the screen edges!
			if (ball.x <= ball.w2) {
				ball.vx = -ball.vx;
				ball.x = ball.w2 + 1;
			} else if (ball.x >= Game.width-ball.w2) {
				ball.vx = -ball.vx;
				ball.x = Game.width-ball.w2 -1;
			}
			if (ball.y <= ball.h2) {
				ball.vy = -ball.vy;
				ball.y = ball.h2 + 1;
			} else if (ball.y >= Game.height+ball.h) {
				// TODO: You lose!
				ball.vx = 0;
				ball.vy = 0;
				ball.launched = false;
			}

		} else {
			// Snap to the paddle!
			ball.x = this.paddle.x;
			ball.y = this.paddle.y - ball.h;
		}

		Game.context2d.drawImage(ball.image, ball.x - ball.w/2, ball.y - ball.h/2);
	};

	this.paddle = {
		image: Game.images["paddle"],

		x: Game.width/2,
		y: Game.height-16,
		w: 64,
		h: 16,

		speed: 500,
	};
	this.paddle.w2 = this.paddle.w/2;
	this.paddle.h2 = this.paddle.h/2;
	this.updatePaddle = function(deltaTime, paddle) {
		if (Game.keysPressed[37]) { // LEFT
			paddle.x -= deltaTime * paddle.speed;
			if (paddle.x < paddle.w/2) {
				paddle.x = paddle.w/2;
			}
		} else if (Game.keysPressed[39]) { // RIGHT
			paddle.x += deltaTime * paddle.speed;
			if (paddle.x > Game.width - paddle.w/2) {
				paddle.x = Game.width - paddle.w/2;
			}
		}

		Game.context2d.drawImage(paddle.image, paddle.x - paddle.w/2, paddle.y - paddle.h/2);
	};

	var BRICK_W = 32;
	var BRICK_H = 16;
	function Brick(x,y) {
		this.x = x;
		this.y = y;
		this.w = BRICK_W;
		this.h = BRICK_H;
		this.w2 = this.w/2;
		this.h2 = this.h/2;
		this.image = Game.images["brick"];
	}
	this.bricks = [];
	for (var x=0; x<18; x++) {
		for (var y=0; y<5; y++) {
			this.bricks.push(new Brick((x+1.5) * BRICK_W, (y + 2.5) * BRICK_H));
		}
	}
	this.updateBricks = function(deltaTime) {
		for (var i=0; i<this.bricks.length; i++) {
			var brick = this.bricks[i];

			Game.context2d.drawImage(brick.image, brick.x - brick.w/2, brick.y - brick.h/2);
		}
	};
}

// Run!
function main(frameTimestamp) {
	window.requestAnimationFrame(main);

	Game.context2d.clearRect(0,0, Game.width,Game.height);

	var deltaTime = (frameTimestamp - Game.lastTimestamp) / 1000;
	if (deltaTime > Game.MAX_FRAME_TIME) {
		deltaTime = Game.MAX_FRAME_TIME;
	}
	Game.lastTimestamp = frameTimestamp;

	Game.scene.update(deltaTime);

	// Regenerate oldKeysPressed
	for (var key in Game.oldKeysPressed) {
		delete Game.oldKeysPressed[key];
	}
	for (var key in Game.keysPressed) {
		Game.oldKeysPressed[key] = true;
	}
}

function start() {
	// Load things!
	var imagesToLoad = [
		"ball",
		"brick",
		"paddle",
	];
	var imagesLoaded = 0;
	var soundsToLoad = [
		"jump",
	];
	var soundsLoaded = 0;

	function checkIfReady() {
		if ((imagesLoaded >= imagesToLoad.length)
			&&(soundsLoaded >= soundsToLoad.length) ) {
			// Done!
			console.log("Finished loading assets!");
			window.requestAnimationFrame(main);
		}
	}

	// --------------------- LOAD IMAGES ------------------------

	function onImageLoaded() {
		imagesLoaded++;
		checkIfReady();
	}

	for (var i=0; i<imagesToLoad.length; i++) {
		var imgName = imagesToLoad[i];
		var img = new Image();
		Game.images[imgName] = img;
		img.onload = onImageLoaded;
		img.src = "assets/" + imgName + ".png";
	}

	// --------------------- LOAD SOUNDS ------------------------

	function onSoundLoaded() {
		soundsLoaded++;
		checkIfReady();
	}

	for (var i=0; i<soundsToLoad.length; i++) {
		var soundName = soundsToLoad[i];
		var sound = new Howl({
			urls: [
				"assets/" + soundName + ".mp3",
				"assets/" + soundName + ".ogg",
				"assets/" + soundName + ".wav",
			],
			onload: onSoundLoaded,
		});
		Game.sounds[soundName] = sound;
	}
}

start();