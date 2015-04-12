/**
 * Sam Atkins' LD32 entry
 */

;

var canvas = document.getElementById("canvas");

var Game = {
	context2d: canvas.getContext("2d"),
	width: canvas.width,
	height: canvas.height,
	keysPressed: {},
	scene: new MenuScene(),
	images: {},
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
	this.update = function() {

		// Go to play scene
		if (Game.keysPressed[32]) {
			Game.scene = new PlayScene();
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
	this.update = function() {
		Game.context2d.drawImage(Game.images["test"], 100, 100);
	};
}

// Run!
function main() {
	window.requestAnimationFrame(main);

	Game.context2d.clearRect(0,0, Game.width,Game.height);

	Game.scene.update();
}

function start() {
	// Load things!

	var imagesToLoad = [
		"test"
	];
	var imagesLoaded = 0;

	function onImageLoaded() {
		imagesLoaded++;
		if (imagesLoaded >= imagesToLoad.length) {
			// Done!
			console.log("Finished loading images!");
			main();
		}
	}

	for (var i=0; i<imagesToLoad.length; i++) {
		var imgName = imagesToLoad[i];
		var img = new Image();
		Game.images[imgName] = img;
		img.onload = onImageLoaded;
		img.src = "assets/" + imgName + ".png";
	}

}

start();