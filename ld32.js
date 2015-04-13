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
	scene: new MenuScene(),
	images: {},
	sounds: {},
};

// Keyboard handling
window.onkeydown = function(e) {
	e = e || window.event;
	Game.keysPressed[e.keyCode] = true;
	console.log("Pressed key", Game.keysPressed);
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
		this.updateBall(deltaTime);
	};

	this.ball = {
		image: Game.images["ball"],

		x: Game.width/2,
		y: Game.height/2,
		w: 16,
		h: 16,

		vx: 0,
		vy: 0,
	};
	this.updateBall = function(deltaTime) {
		this.ball.x += this.ball.vx;
		this.ball.y += this.ball.vy;

		Game.context2d.drawImage(this.ball.image, this.ball.x - this.ball.w/2, this.ball.y - this.ball.h/2);
	}
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
}

function start() {
	// Load things!
	var imagesToLoad = [
		"ball"
	];
	var imagesLoaded = 0;
	var soundsToLoad = [
		"jump"
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