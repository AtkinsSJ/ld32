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
	mouse: {x:0, y:0},
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
	console.log("Just pressed ", e.keyCode);
};
window.onkeyup = function(e) {
	e = e || window.event;
	delete Game.keysPressed[e.keyCode];
};

canvas.onclick = function(e) {
	e = e || window.event;
	var clickX = e.clientX - canvas.offsetLeft + window.scrollX;
	var clickY = e.clientY - canvas.offsetTop + window.scrollY;
	Game.scene.onClick(clickX, clickY);
};
// canvas.onmousemove = function(e) {
// 	e = e || window.event;
// 	Game.mouse.x = e.clientX - canvas.offsetLeft + window.scrollX;
// 	Game.mouse.y = e.clientY - canvas.offsetTop + window.scrollY;
// };

KEY_LEFT = 37;
KEY_RIGHT = 39;
KEY_UP = 38;
KEY_DOWN = 40;
KEY_W = 87;
KEY_A = 65;
KEY_S = 83;
KEY_D = 68;

TEAM_PLAYER = 1;
TEAM_ENEMY = 2;

function clamp(value, min, max) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

function normalise(vector) {
	var length = Math.sqrt( (vector.x*vector.x) + (vector.y*vector.y) );
	vector.x /= length;
	vector.y /= length;
	return vector;
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

	this.onClick = function(x,y) {
		
	};
}

function PlayScene() {

	function Entity(playScene, x,y, image, team) {
		this.playScene = playScene;
		this.x = x;
		this.y = y;
		this.image = image;
		this.width = this.image.width;
		this.height = this.image.height;
		this.team = team;
	}

	function Player(playScene, x,y) {
		Entity.call(this, playScene, x,y, Game.images["player"], TEAM_PLAYER);
		this.speed = 200;

		this.update = function(deltaTime) {
			// Player!
			if (Game.keysPressed[KEY_LEFT] || Game.keysPressed[KEY_A]) {
				this.x -= this.speed * deltaTime;
			} else if (Game.keysPressed[KEY_RIGHT] || Game.keysPressed[KEY_D]) {
				this.x += this.speed * deltaTime;
			}
			if (Game.keysPressed[KEY_UP] || Game.keysPressed[KEY_W]) {
				this.y -= this.speed * deltaTime;
			} else if (Game.keysPressed[KEY_DOWN] || Game.keysPressed[KEY_S]) {
				this.y += this.speed * deltaTime;
			}
			this.x = clamp(this.x, 0, this.playScene.width-this.width);
			this.y = clamp(this.y, 0, this.playScene.height-this.height);
		};

		this.shootAt = function(targetX, targetY) {
			var diff = {x: targetX - this.x,
						y: targetY - this.y};
			diff = normalise(diff);
			diff.x *= 300;
			diff.y *= 300;

			this.playScene.entities.push(new Bullet(
				this.playScene, this.x, this.y, Game.images["bullet"], this.team, diff.x, diff.y
			));
		};
	}

	function Bullet(playScene, x,y, image, team, vx,vy) {
		Entity.call(this, playScene, x,y, image, team);
		this.vx = vx;
		this.vy = vy;

		this.update = function(deltaTime) {
			this.x += vx * deltaTime;
			this.y += vy * deltaTime;

			// // Check for collisions
			// if (this.x < 0)
		};
	}

	this.start = function() {
		this.tilesX = 32;
		this.tilesY = 32;
		this.width = this.tilesX * Game.images["floor"].width;
		this.height = this.tilesY * Game.images["floor"].height;
		this.entities = [];

		this.player = new Player(this, 200,100);
		this.entities.push(this.player);

		this.camera = {
			x: this.player.x,
			y: this.player.y,
		};
	};

	this.update = function(deltaTime) {
		for (var i = 0; i < this.entities.length; i++) {
			this.entities[i].update(deltaTime);
		};

		// Camera
		var cx = this.player.x + (this.player.width - Game.width)/2;
		var cy = this.player.y + (this.player.height - Game.height)/2;
		cx = clamp(cx, 0, this.width - Game.width);
		cy = clamp(cy, 0, this.height - Game.height);
		this.camera.x =  cx;
		this.camera.y =  cy;

		// Draw flooring
		var floorTile = Game.images["floor"];
		var tilesAcross = (Game.width / floorTile.width) + 1;
		var tilesDown = (Game.height / floorTile.height) + 1;
		var startX = Math.floor(this.camera.x / floorTile.width);
		var startY = Math.floor(this.camera.y / floorTile.height);
		for (var y = 0; y < tilesDown; y++) {
			for (var x = 0; x < tilesAcross; x++) {
				Game.context2d.drawImage(floorTile,
					(startX + x)*floorTile.width - this.camera.x,
					(startY + y)*floorTile.height - this.camera.y);
			};
		};

		// Draw everything else
		for (var i = 0; i < this.entities.length; i++) {
			var entity = this.entities[i];
			Game.context2d.drawImage(entity.image, entity.x - this.camera.x, entity.y - this.camera.y);
		}
	};

	this.onClick = function(x,y) {
		this.player.shootAt(x + this.camera.x, y + this.camera.y);
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
		"bullet",
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