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
	// console.log("Just pressed ", e.keyCode);
};
window.onkeyup = function(e) {
	e = e || window.event;
	delete Game.keysPressed[e.keyCode];
};

KEY_LEFT = 37;
KEY_RIGHT = 39;
KEY_UP = 38;
KEY_DOWN = 40;

function clamp(value, min, max) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

function MenuScene() {
	this.update = function(deltaTime) {
		Game.context2d.font = "20px sans-serif";
		Game.context2d.fillStyle = "white";
		Game.context2d.textAlign = "center";
		Game.context2d.textBaseline = "middle";

		// Go to play scene
		if (Game.keysPressed[32]) {
			Game.scene = new PlayScene();
			//Game.sounds["Start"].play();
		}

		// Render text
		Game.context2d.fillText("LD32 game!", Game.width/2, 20);
		Game.context2d.fillText("Press Space to play!", Game.width/2, Game.height/3);
	};
}

function PlayScene() {
	function Player(x,y) {
		this.x = x;
		this.y = y;
		this.image = Game.images["player"];
		this.width = this.image.width;
		this.height = this.image.height;
		this.speed = 200;

		this.update = function(deltaTime, playScene) {
			// Player!
			if (Game.keysPressed[KEY_LEFT]) {
				this.x -= this.speed * deltaTime;
			} else if (Game.keysPressed[KEY_RIGHT]) {
				this.x += this.speed * deltaTime;
			}
			if (Game.keysPressed[KEY_UP]) {
				this.y -= this.speed * deltaTime;
			} else if (Game.keysPressed[KEY_DOWN]) {
				this.y += this.speed * deltaTime;
			}
			this.x = clamp(this.x, 0, playScene.width-this.width);
			this.y = clamp(this.y, 0, playScene.height-this.height);
		};
	}

	this.start = function() {
		this.tilesX = 32;
		this.tilesY = 32;
		this.width = this.tilesX * Game.images["floor"].width;
		this.height = this.tilesY * Game.images["floor"].height;

		this.player = new Player(200,100);

		this.camera = {
			x: this.player.x,
			y: this.player.y
		};
	};

	this.update = function(deltaTime) {

		this.player.update(deltaTime, this);
		var cx = this.player.x + (this.player.width - Game.width)/2;
		var cy = this.player.y + (this.player.height - Game.height)/2;
		cx = clamp(cx, 0, this.width - Game.width);
		cy = clamp(cy, 0, this.height - Game.height);
		this.camera.x =  cx;
		this.camera.y =  cy;

		// Draw flooring
		var floorTile = Game.images["floor"];
		for (var y = 0; y < this.tilesY; y++) {
			for (var x = 0; x < this.tilesX; x++) {
				Game.context2d.drawImage(floorTile, (x*floorTile.width) - this.camera.x, y*floorTile.height - this.camera.y);
			};
		};

		Game.context2d.drawImage(this.player.image, this.player.x - this.camera.x, this.player.y - this.camera.y);
	};

	this.start();
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
		"floor",
		"player"
	];
	var imagesLoaded = 0;
	var soundsToLoad = [
		
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

	checkIfReady();
}

start();