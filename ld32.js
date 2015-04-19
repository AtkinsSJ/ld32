/**
 * Sam Atkins' LD32 entry
 */

;

var canvas = document.getElementById("canvas");

var Game = {
	MAX_FRAME_TIME: 1.0/30.0,

	context2d: canvas.getContext("2d"),
	width: canvas.width,
	height: canvas.height,
	keysPressed: {},
	oldKeysPressed: {},
	mouse: {x:0, y:0, down:false},
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

// canvas.onclick = function(e) {
// 	e = e || window.event;
// 	var clickX = e.clientX - canvas.offsetLeft + window.scrollX;
// 	var clickY = e.clientY - canvas.offsetTop + window.scrollY;
// 	Game.scene.onClick(clickX, clickY);
// };
window.onmousedown = function(e) {
	e = e || window.event;
	if (e.buttons & 1) {
		Game.mouse.down = true;
	}
};
window.onmouseup = function(e) {
	e = e || window.event;
	if (e.buttons & 1) {
		Game.mouse.down = false;
	}
};
canvas.onmousemove = function(e) {
	e = e || window.event;
	Game.mouse.x = e.clientX - canvas.offsetLeft + window.scrollX;
	Game.mouse.y = e.clientY - canvas.offsetTop + window.scrollY;
};

KEY_LEFT = 37;
KEY_RIGHT = 39;
KEY_UP = 38;
KEY_DOWN = 40;
KEY_W = 87;
KEY_A = 65;
KEY_S = 83;
KEY_D = 68;

TEAM_NONE = 0;
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

function limit(vector, maxLength) {
	var length = Math.sqrt( (vector.x*vector.x) + (vector.y*vector.y) );
	if (length > maxLength) {
		var mul = maxLength / length;
		vector.x *= mul;
		vector.y *= mul;
	}
	return vector;
}

function angle(vector) {
	return Math.atan2(vector.y,vector.x) * 180 / Math.PI;
}

function vectorFromAngle(angle, length) {
	length = length || 1;
	var a = angle * Math.PI / 180;
	return {
		x: Math.cos(a) * length, 
		y: Math.sin(a) * length, 
	};
}

function overlaps(a,b) {
	var minX = b.x - b.w2 - a.w2,
		maxX = minX + b.width + a.width,
		minY = b.y - b.w2 - a.h2,
		maxY = minY + b.height + a.height;

	return (a.x >= minX) && (a.x < maxX) && (a.y >= minY) && (a.y < maxY);
}

function distance(a,b) {
	var xDiff = Math.abs(a.x - b.x),
		yDiff = Math.abs(a.y - b.y);
	return Math.sqrt(xDiff*xDiff + yDiff*yDiff);
}

function pad(num, size) {
	var s = "000000000" + num;
	return s.substr(s.length-size);
}

function MenuScene() {
	this.update = function(deltaTime) {
		Game.context2d.font = "20px sans-serif";
		Game.context2d.fillStyle = "white";
		Game.context2d.textAlign = "center";
		Game.context2d.textBaseline = "middle";

		// Go to play scene
		if (wasKeyJustPressed(32)) {
			Game.scene = new PlayScene();
			Game.sounds["select"].play();
		}

		// Render text
		Game.context2d.fillText("Food Fight!", Game.width/2, 20);
		Game.context2d.fillText("Made for Ludum Dare 32", Game.width/2, 50);
		Game.context2d.fillText("By Sam 'AtkinsSJ' Atkins", Game.width/2, 80);
		Game.context2d.fillText("Press Space to play!", Game.width/2, 200);
	};

	this.onClick = function(x,y) { };
}

function PlayScene() {

	function Entity(playScene, x,y, image, team, solid, isBullet, hurtSound, dieSound) {
		this.playScene = playScene;
		this.x = x;
		this.y = y;
		this.image = image;
		this.width = this.image.width;
		this.height = this.image.height;
		this.w2 = this.width/2;
		this.h2 = this.height/2;
		this.team = team;
		this.solid = solid;
		this.alive = true;
		this.rotation = 0;
		this.isBullet = isBullet;

		this.hurtSound = hurtSound;
		this.dieSound = dieSound;

		this.moveAroundMap = function(xDiff, yDiff, player, bounce) {
			var oldX = this.x,
				oldY = this.y;
			this.x += xDiff;
			this.y += yDiff;

			var entities = this.playScene.entities;
			for (var i = 0; i < entities.length; i++) {
				var other = entities[i];
				if (other.solid && (other != this)) {
					// Don't walk through walls and creatures
					if (overlaps(this, other)) {

						// If player, damage them!
						if (other.team == TEAM_PLAYER) {
							other.takeDamage(this.damage);
						} else if (bounce) {
							Game.sounds["sprout-bounce"].play();
						}

						// Stops the (non-solid) mash from bouncing off the player.
						if (this.solid || other.team == TEAM_NONE) {

							var t = this.y;
							this.y = oldY;
							var overlapsX = overlaps(this,other);
							this.y = t;

							t = this.x;
							this.x = oldX;
							var overlapsY = overlaps(this,other);
							this.x = t;

							if (overlapsX) {
								if (this.x > oldX) { // Going Right
									this.x = other.x - other.w2 - this.w2 - 1;
								} else if (this.x < oldX) { // Going Left
									this.x = other.x + other.w2 + this.w2 + 1;
								}

								if (bounce) {
									this.v.x = -this.v.x;
								}
							}

							if (overlapsY) {
								if (this.y > oldY) { // Going Down
									this.y = other.y - other.h2 - this.h2 - 1;
								} else if (this.y < oldY) { // Going Up
									this.y = other.y + other.h2 + this.h2 + 1;
								}

								if (bounce) {
									this.v.y = -this.v.y;
								}
							}
						}
					}
				}
			};

			// Stay in bounds! Not actually needed.
			// this.x = clamp(this.x, 0, this.playScene.width-this.width);
			// this.y = clamp(this.y, 0, this.playScene.height-this.height);
		};

		this.update = function(deltaTime) {};

		this.takeDamage = function(damage) {
			if (!this.hasOwnProperty("health")) return;

			this.health -= damage;
			if (this.health <= 0) {
				// DEAD!
				this.dieSound.play();
				this.alive = false;
			} else {
				this.hurtSound.play();
			}
		};

		this.hasRoom = function() {
			var entities = this.playScene.entities;
			for (var i = 0; i < entities.length; i++) {
				var other = entities[i];
				if (other.solid && (other != this) && (other.team == TEAM_NONE) && overlaps(this, other)) {
					return false;
				}
			}
			return true;
		};
	}

	function Player(playScene, x,y) {
		Entity.call(this, playScene, x,y, Game.images["player"], TEAM_PLAYER, true, false, Game.sounds["player-hurt"], Game.sounds["player-die"]);
		this.speed = 200;
		this.health = 100;
		this.shootDelay = 0.2;
		this.shootCooldown = 0;
		this.score = 0;
		this.scoreText = pad(this.score, 7);

		this.update = function(deltaTime) {
			// Player!
			var xDiff = 0,
				yDiff = 0;
			if (Game.keysPressed[KEY_LEFT] || Game.keysPressed[KEY_A]) {
				xDiff = -this.speed * deltaTime;
			} else if (Game.keysPressed[KEY_RIGHT] || Game.keysPressed[KEY_D]) {
				xDiff = this.speed * deltaTime;
			}
			if (Game.keysPressed[KEY_UP] || Game.keysPressed[KEY_W]) {
				yDiff = -this.speed * deltaTime;
			} else if (Game.keysPressed[KEY_DOWN] || Game.keysPressed[KEY_S]) {
				yDiff = this.speed * deltaTime;
			}

			this.moveAroundMap(xDiff, yDiff);

			if (this.shootCooldown >= 0) {
				this.shootCooldown -= deltaTime;
			}
			if (Game.mouse.down) {
				this.shootAt(this.playScene.getMousePosition());
			}
		};

		this.shootAt = function(target) {
			if (this.shootCooldown > 0) return;

			var diff = {x: target.x - this.x,
						y: target.y - this.y};
			diff = normalise(diff);
			diff.x *= 350;
			diff.y *= 350;

			this.playScene.entities.push(new Bullet(
				this.playScene, this.x, this.y, Game.images["bullet"], this.team, diff.x, diff.y, 5
			));

			Game.sounds["player-fire"].play();

			this.shootCooldown = this.shootDelay;
		};

		this.addPoints = function(points) {
			this.score += points;
			this.scoreText = pad(this.score, 7);

			// Determine if we've won
			var entities = this.playScene.entities;
			var foundEnemies = false;
			for (var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				if (entity.team == TEAM_ENEMY && entity.alive && !entity.isBullet) {
					foundEnemies = true;
					break;
				}
			}

			if (!foundEnemies) {
				// YOU WIN!
				this.playScene.gameWon = true;
				Game.sounds["player-win"].play();
			}
		};
	}

	function Monster(playScene, x,y, image, player, health, damage, points, solid, hurtSound, dieSound) {
		Entity.call(this, playScene, x,y, image, TEAM_ENEMY, solid, false, hurtSound, dieSound);
		this.player = player;
		this.health = health;
		this.damage = damage;
		this.points = points;

		this.takeDamage = function(damage) {
			this.health -= damage;
			if (this.health <= 0) {
				// DEAD!
				this.alive = false;
				this.player.addPoints(this.points);

				this.dieSound.play();
			} else {
				this.hurtSound.play();
			}
		};
	};

	function Sprout(playScene, x,y, player) {
		Monster.call(this, playScene, x,y, Game.images["sprout"], player, 10, 5, 25, true, Game.sounds["sprout-hurt"], Game.sounds["sprout-die"]);
		this.v = {x:0, y:0};
		this.acceleration = 300;
		this.maxSpeed = 300;

		this.update = function(deltaTime) {
			if (distance(this, this.player) < 300) {
				// Accelerate towards player
				var toPlayer = {x: this.player.x - this.x,
								y: this.player.y - this.y};
				toPlayer = normalise(toPlayer);
				var acc = this.acceleration * deltaTime;
				this.v.x += toPlayer.x * acc;
				this.v.y += toPlayer.y * acc;

				this.v = limit(this.v, this.maxSpeed);
			}

			this.moveAroundMap(this.v.x * deltaTime, this.v.y * deltaTime, this.player, true);
			this.rotation += (this.v.x + this.v.y) * deltaTime * 5;
		};
	}

	/**
		HE DID THE MASH, HE DID THE MONSTER MASH!
		THE MONSTER MASH, IT WAS A GRAVEYARD SMASH!
		HE DID THE MASH, IT CAUGHT ON IN A FLASH!
		HE DID THE MASH, HE DID THE MONSTER MASH!
	*/
	function MonsterMash(playScene, x,y, player, size) {
		Monster.call(this, playScene, x,y, Game.images["mash"], player, 5 * size, 1, 10 * size, false, Game.sounds["mash-hurt"], Game.sounds["mash-die"]);
		this.speed = 100 / size;
		this.size = size;
		var scale = this.size / 5;
		this.width *= scale;
		this.height *= scale;
		this.w2 = this.width/2;
		this.h2 = this.height/2;

		this.update = function(deltaTime) {
			if (distance(this, this.player) < 700) {
				var diff = {x: this.player.x - this.x,
							y: this.player.y - this.y};
				diff = normalise(diff);
				var v = this.speed * deltaTime;
				diff.x *= v;
				diff.y *= v;

				this.moveAroundMap(diff.x, diff.y, player);
			}
		};

		this.takeDamage = function(damage) {
			this.health -= damage;
			if (this.health <= 0) {
				// DEAD!
				if (this.size > 1) {

					// Spawn smaller mashes!
					// Attempt to spawn 4, each of which will fail if there isn't room.
					var childW2 = this.image.width * (this.size-1)*0.1;
					var childH2 = this.image.width * (this.size-1)*0.1;
					var positions = [
						{x: this.x - childW2, 	y: this.y},
						{x: this.x + childW2, 	y: this.y},
						{x: this.x, 			y: this.y - childH2},
						{x: this.x, 			y: this.y + childH2},
					];
					for (var i=0; i<positions.length; i++) {
						var child = new MonsterMash(this.playScene, positions[i].x, positions[i].y, this.player, this.size - 1);
						if (child.hasRoom()) {
							this.playScene.entities.push(child);
						}
					}
				}
				this.alive = false;
				this.player.addPoints(this.points);
				this.dieSound.play();
			} else {
				this.hurtSound.play();
			}
		}
	}

	function Broccoli(playScene, x,y, player) {
		Monster.call(this, playScene, x,y, Game.images["broccoli"], player, 30, 0, 50, true, Game.sounds["sprout-hurt"], Game.sounds["sprout-die"]);
		this.speed = 300;
		this.shootCooldown = 0;
		this.shootDelay = 1;
		this.shootAngle = 20;

		this.update = function(deltaTime) {
			// Shoot!
			if (this.shootCooldown > 0) {
				this.shootCooldown -= deltaTime;
			}
			this.shootPlayer();

			var playerDistance = distance(this, this.player);
			if (playerDistance < 300) {
				// RUN AWAY!!!!
				var v = {x:this.x - this.player.x,
						 y: this.y - this.player.y};
				v = normalise(v);
				v.x *= this.speed * deltaTime;
				v.y *= this.speed * deltaTime;
				this.moveAroundMap(v.x, v.y);
			}
		};

		this.shootPlayer = function() {
			if (this.shootCooldown > 0) return;

			var diff = {x: this.player.x - this.x,
						y: this.player.y - this.y};
			diff = normalise(diff);
			diff.x *= 350;
			diff.y *= 350;
			var angleToPlayer = angle(diff);
			this.playScene.entities.push(new Bullet(
				this.playScene, this.x, this.y, Game.images["broccoli-bullet"], this.team, diff.x, diff.y, 5, angleToPlayer + 90
			));

			var angleA = angleToPlayer + this.shootAngle;
			var angleB = angleToPlayer - this.shootAngle;
			var diffA = vectorFromAngle(angleA, 350);
			this.playScene.entities.push(new Bullet(
				this.playScene, this.x, this.y, Game.images["broccoli-bullet"], this.team, diffA.x, diffA.y, 5, angleA + 90
			));
			var diffB = vectorFromAngle(angleB, 350);
			this.playScene.entities.push(new Bullet(
				this.playScene, this.x, this.y, Game.images["broccoli-bullet"], this.team, diffB.x, diffB.y, 5, angleB + 90
			));

			// Game.sounds["player-fire"].play();

			this.shootCooldown = this.shootDelay;
		};
	}

	function Bullet(playScene, x,y, image, team, vx,vy, damage, rotation) {
		Entity.call(this, playScene, x,y, image, team, false, true);
		this.vx = vx;
		this.vy = vy;
		this.damage = damage;
		this.rotation = rotation || 0;

		this.update = function(deltaTime) {
			this.x += vx * deltaTime;
			this.y += vy * deltaTime;

			// Check for collisions
			if (this.x < 0 || this.x > this.playScene.width
				|| this.y < 0 || this.y > this.playScene.height) {
				this.alive = false;
				return;
			}

			for (var i=0; i<this.playScene.entities.length; i++) {
				var entity = this.playScene.entities[i];
				if (entity.team == this.team || !entity.solid) continue;
				if (overlaps(this, entity)) {

					if (entity.team != TEAM_NONE) {
						entity.takeDamage(this.damage);
					}

					this.alive = false;
					return;
				}
			}
		};
	}

	function Wall(playScene, x,y, image) {
		Entity.call(this, playScene, x, y, image, TEAM_NONE, true, false);
	}

	this.start = function() {

		var level = [
			[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
			[1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,3,0,0,1,],
			[1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,0,0,0,0,0,1,],
			[1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,1,],
			[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,1,],
			[1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,3,0,0,0,0,1,],
			[1,0,0,0,0,0,5,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,],
			[1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,],
			[1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,3,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,],
			[1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,3,0,0,0,3,0,0,1,1,1,1,0,0,0,0,3,0,1,1,1,1,1,],
			[1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1,1,0,0,0,0,0,0,0,0,0,3,0,0,0,0,1,1,1,1,1,],
			[1,1,1,1,1,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,1,0,0,3,0,0,0,0,3,0,0,0,0,0,0,1,1,1,1,1,],
			[1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,3,0,0,0,3,0,0,0,1,1,1,1,0,0,0,3,0,0,1,1,1,1,1,],
			[1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,3,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,],
			[1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,],
			[1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,],
			[1,0,3,0,0,3,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,3,0,1,],
			[1,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,1,],
			[1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,3,1,],
			[1,0,0,3,0,3,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,3,0,0,0,0,1,],
			[1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,3,0,0,1,],
			[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
		];
		this.tilesX = level[0].length;
		this.tilesY = level.length;
		var floorImage = Game.images["floor"];
		var tileW = floorImage.width;
		var tileH = floorImage.height;
		this.width = this.tilesX * tileW;
		this.height = this.tilesY * tileH;
		this.entities = [];
		this.gameWon = false;

		this.player = new Player(this, 0,0);

		var wallImage = Game.images["wall"],
			sproutImage = Game.images["sprout"];
		for (var y=0; y<this.tilesY; y++) {
			for (var x=0; x<this.tilesX; x++) {
				var xx = (x + 0.5) * tileW,
					yy = (y + 0.5) * tileH;
				switch (level[y][x]) {
					case 1:	{
						this.entities.push(new Wall(this, xx, yy, wallImage));
					} break;
					case 2:	{
						this.player.x = xx;
						this.player.y = yy;
					} break;
					case 3: { // Sprout!
						// this.entities.push(new Sprout(this, xx, yy, this.player));
					} break;
					case 4: { // Monster Mash!
						// this.entities.push(new MonsterMash(this, xx, yy, this.player, 5));
					} break;
					case 5: { // Broccoli
						this.entities.push(new Broccoli(this, xx, yy, this.player));
					} break;
				}
			}
		}

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
		// Clear-out dead entities
		this.entities = this.entities.filter(function(entity){
			return entity.alive;
		});

		// Camera
		var cx = this.player.x - Game.width/2;
		var cy = this.player.y - Game.height/2;
		cx = clamp(cx, 0, this.width - Game.width);
		cy = clamp(cy, 0, this.height - Game.height);
		this.camera.x =  cx;
		this.camera.y =  cy;

		// Draw table
		Game.context2d.drawImage(
			Game.images["background"],
			this.camera.x, this.camera.y, Game.width, Game.height, // Source rect
			0,0, Game.width, Game.height // Dest rect
		);

		// Draw flooring
		// var floorTile = Game.images["floor"];
		// var tilesAcross = (Game.width / floorTile.width) + 1;
		// var tilesDown = (Game.height / floorTile.height) + 1;
		// var startX = Math.floor(this.camera.x / floorTile.width);
		// var startY = Math.floor(this.camera.y / floorTile.height);
		// for (var y = 0; y < tilesDown; y++) {
		// 	for (var x = 0; x < tilesAcross; x++) {
		// 		Game.context2d.drawImage(floorTile,
		// 			(startX + x)*floorTile.width - this.camera.x,
		// 			(startY + y)*floorTile.height - this.camera.y);
		// 	};
		// };

		// Draw everything else
		for (var i = 0; i < this.entities.length; i++) {
			var entity = this.entities[i];
			// Fancy drawing with rotation and everything!
			Game.context2d.translate(entity.x - this.camera.x, entity.y - this.camera.y);
			if (entity.rotation != 0) {
				Game.context2d.rotate(entity.rotation * Math.PI / 180);
			}
			Game.context2d.drawImage(entity.image, -entity.w2,-entity.h2, entity.width, entity.height);
			Game.context2d.setTransform(1, 0, 0, 1, 0, 0);
		}

		// Draw UI
		Game.context2d.fillStyle = "rgba(0,0,0,0.5)";
		Game.context2d.fillRect(0,0, Game.width, 30);

		Game.context2d.font = "20px sans-serif";
		Game.context2d.fillStyle = "white";
		Game.context2d.textBaseline = "middle";

		Game.context2d.textAlign = "left";
		Game.context2d.fillText("Health: " + this.player.health, 5, 15);

		Game.context2d.textAlign = "right";
		Game.context2d.fillText("Score: " + this.player.scoreText, Game.width-5, 15);

		// Game over stuff
		if (this.gameWon || !this.player.alive) {

			Game.context2d.fillStyle = "rgba(0,0,0,0.5)";
			Game.context2d.fillRect(0,30, Game.width, Game.height-30);

			var message = this.gameWon ? "YOU WIN! :D" : "You were defeated by angry vegetables. :(";

			Game.context2d.font = "28px sans-serif";
			Game.context2d.fillStyle = "white";
			Game.context2d.textAlign = "center";
			Game.context2d.fillText(message, Game.width/2, Game.height/2);

			Game.context2d.font = "20px sans-serif";
			Game.context2d.fillText("Press space to return to the menu.", Game.width/2, Game.height * 0.75);

			if (wasKeyJustPressed(32)) {
				Game.scene = new MenuScene();
				Game.sounds["select"].play();
			}
		}
	};

	this.getMousePosition = function() {
		return {x: Game.mouse.x + this.camera.x,
				y: Game.mouse.y + this.camera.y};
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

	Game.context2d.font = "20px sans-serif";
	Game.context2d.fillStyle = "white";
	Game.context2d.textAlign = "center";
	Game.context2d.textBaseline = "middle";
	var loadingText = "Loading";
	Game.context2d.fillText(loadingText, Game.width/2, Game.height/2);

	// Load things!
	var imagesToLoad = [
		"background",
		"broccoli",
		"broccoli-bullet",
		"bullet",
		"floor",
		"mash",
		"player",
		"sprout",
		"wall",
	];
	var imagesLoaded = 0;
	var soundsToLoad = [
		"player-fire",
		"player-hurt",
		"player-die",
		"player-win",
		"sprout-bounce",
		"sprout-hurt",
		"sprout-die",
		"mash-hurt",
		"mash-die",
		"select",
	];
	var soundsLoaded = 0;

	function checkIfReady() {
		if ((imagesLoaded >= imagesToLoad.length)
			&&(soundsLoaded >= soundsToLoad.length) ) {
			// Done!
			console.log("Finished loading assets!");
			window.requestAnimationFrame(main);
		} else {
			loadingText += '.';

			Game.context2d.clearRect(0,0, Game.width, Game.height);
			Game.context2d.fillText(loadingText, Game.width/2, Game.height/2);
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