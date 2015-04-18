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
		Game.context2d.font = "20px sans-serif";
		Game.context2d.fillStyle = "white";
		Game.context2d.textAlign = "center";
		Game.context2d.textBaseline = "middle";

		if (navigator.getUserMedia) {
			// Go to play scene
			if (Game.keysPressed[32]) {
				Game.scene = new PlayScene();
				Game.sounds["Start"].play();
			}

			// Render text
			Game.context2d.fillText("LD32 game!", Game.width/2, 20);
			Game.context2d.fillText("Press Space to play!", Game.width/2, Game.height/3);
		} else {

			// Render text
			Game.context2d.fillText("LD32 game!", Game.width/2, 20);
			Game.context2d.fillText("Sorry, your browser doesn't have microphone support. :(", Game.width/2, Game.height/3);
		}
	};
}

function PlayScene() {
	this.start = function() {
		var audioContext = new (window.AudioContext || window.webkitAudioContext)();
		this.analyser = audioContext.createAnalyser();

		var self = this;

		navigator.getUserMedia({audio: true}, function(stream) {
			var source = audioContext.createMediaStreamSource(stream);
			source.connect(self.analyser);
			window.audioSourceReference = source;

			self.frequencyBufferLength = self.analyser.frequencyBinCount;
			self.frequencyDataArray = new Uint8Array(self.frequencyBufferLength);

		}, function(error) {
			self.error = error;
		});
	};

	this.update = function(deltaTime) {
		if (!this.frequencyDataArray) return; // Wait until the audio stuff is linked up

		if (this.error) {
			Game.context2d.fillText(error, Game.width/2, 20);
			return;
		}

		this.analyser.getByteFrequencyData(this.frequencyDataArray);

		// Debug visualiser
		Game.context2d.fillStyle = 'rgb(0, 0, 0)';
		Game.context2d.fillRect(0, 0, Game.width, Game.height);

		var barWidth = (Game.width / this.frequencyBufferLength) * 2.5;
		var barHeight;
		var x = 0;

		for(var i = 0; i < this.frequencyBufferLength; i++) {
			barHeight = this.frequencyDataArray[i];

			Game.context2d.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
			Game.context2d.fillRect(x,Game.height-barHeight/2,barWidth,barHeight/2);

			x += barWidth + 1;
		}
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
		"ball",
		"brick",
		"paddle",
	];
	var imagesLoaded = 0;
	var soundsToLoad = [
		"Bounce-brick",
		"Bounce-paddle",
		"Bounce-wall",
		"Build-brick",
		"Lose",
		"Start",
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

	// --------------------- MICROPHONE? ------------------------
	navigator.getUserMedia = navigator.getUserMedia ||
						navigator.webkitGetUserMedia ||
						navigator.mozGetUserMedia ||
						navigator.msGetUserMedia;

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