/**
 * Sam Atkins' LD32 entry
 */

;function Game() {
	var canvas = document.getElementById("canvas");

	this.context2d = canvas.getContext("2d");
	this.width = canvas.width;
	this.height = canvas.height;

	// Keyboard handling
	this.keysPressed = {};
	this.onkeydown = function(e) {
		e = e || window.event;
		this.keysPressed[e.keyCode] = true;
	};
	this.onkeyup = function(e) {
		e = e || window.event;
		delete this.keysPressed[e.keyCode];
	};
	window.onkeydown = this.onkeydown;
	window.onkeyup = this.onkeyup;

	// Run!
	this.start = function() {
		window.requestAnimationFrame(this.update);
	};
	this.update = function() {

		this.context2d.clearRect(0,0, width,height);

		window.requestAnimationFrame(this.update);
	};
}

var game = new Game();
game.start();
