let canvas, ctx;
let timer;
let snake;
let apple;

const scl = 20, delay = 100;

let keys = [];
let active;

window.onload = () => {
    // Canvas setup
    canvas = document.getElementById('board');
    canvas.width = 960;
    canvas.height = 540;

    // Canvas context and fill color
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';

    // Create snake and apple with random position
    // The snake will start with a direction of RIGHT if it's initial length is greater than 1
    snake = new Snake(
        Math.floor( (Math.random() * canvas.width / (2 * scl)) + (canvas.width / (4 * scl)) ) * scl,
        Math.floor( (Math.random() * canvas.height / (2 * scl)) + (canvas.height / (4 * scl)) ) * scl
    );
    
    if (snake.size === 1) snake.setDirection('STILL');

    apple = new Apple(0, 0);
    apple.randLocation(snake);

    // Start timer for updating game state and drawing each frame
    timer = setInterval(() => {
        tick();
        draw();
    }, delay);
    active = true;
}

document.onkeydown = e => {
    switch (e.keyCode) {
        case 65: // A (left)
            keys.push('LEFT');
            break;
        case 87: // W (up)
            keys.push('UP');
            break;
        case 68: // D (right)
            keys.push('RIGHT');
            break;
        case 83: // S (down)
            keys.push('DOWN');
            break;
        case 32: // Space (pause)
            if (active) {
                clearInterval(timer);
                active = false;
            } else {
                timer = setInterval(() => {
                    tick();
                    draw();
                }, delay);
                active = true;
            }
            break;
    }
}

function tick() {
    if (keys.length > 0)
        snake.setDirection(keys.shift()); // Removes the first element of keys and passes it as an arg. for setDirection
    snake.move();
    snake.hitDetect();
    snake.tryToEat(apple);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snake.draw(ctx);
    apple.draw(ctx);
}

function end(score) {
    clearInterval(timer);
    active = false;
    alert(`Game over, score: ${score}`);
    location.reload();
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Apple extends Point {
    constructor(x, y) {
        super(x, y);
        this.color = '#f00';
        this.big = false;
    }

    randLocation(snake) {
        this.big = Math.random() < 0.075;

        let collision;
        start:
        if (this.big) {
            let counter = 0;
            do {
                counter++;
                if (counter > 100) {
                    this.big = false;
                    break start;
                }

                collision = false; 
                // Random location anywhere on canvas
                // x and y are guaranteed to be a multiple of scl
                this.x = Math.floor(Math.random() * canvas.width / scl) * scl;
                this.y = Math.floor(Math.random() * canvas.height / scl) * scl;

                // Checking if the apple goes off the canvas
                if (this.x - scl < 0 || this.x + scl >= canvas.width) {
                    collision = true;
                    continue;
                }
                if (this.y - scl < 0 || this.y + scl >= canvas.height) {
                    collision = true;
                    continue;
                }     
    
                // Checking for intersection with snake
                for (let p of snake.tail) {
                    if (snake.tail.indexOf(p) === 0) continue;
                    // If the center of the apple is within 1 scl length of any part of the snake then it will try a different location
                    // This is to ensure that even if the apple is big it won't intersect the snake
                    if (Math.abs(this.x - p.x) <= scl && Math.abs(this.y - p.y) <= scl) {
                        collision = true;
                        break;
                    }
                }
            } while (collision);
        } else {
            do {
                collision = false;
                // Random location anywhere on canvas
                // x and y are guaranteed to be a multiple of scl
                this.x = Math.floor(Math.random() * canvas.width / scl) * scl;
                this.y = Math.floor(Math.random() * canvas.height / scl) * scl;
    
                for (let p of snake.tail) {
                    if (snake.tail.indexOf(p) === 0) continue;
                    if (this.x === p.x && this.y === p.y) {
                        collision = true;
                        break;
                    }
                }
            } while (collision);
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        if (this.big) {
            ctx.fillRect(this.x - scl, this.y - scl, scl * 3, scl * 3);
            ctx.fillStyle = '#900'; // Dark red
            ctx.fillRect(this.x, this.y, scl, scl);
        } else {
            ctx.fillRect(this.x, this.y, scl, scl);
        }
    }
}

class Snake {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direct = 'RIGHT';
        this.vx = scl;
        this.vy = 0;
        this.color = '#000';
        this.size = 3; // Can be set to any initial value
        this.tail = [new Point(this.x, this.y)];
    }

    setDirection(dir) {
        let tempVx = this.vx;
        let tempVy = this.vy;
        let switched = false;

        this.vx = 0;
        this.vy = 0;

        switch (dir) {
            case 'LEFT':
                if (this.direct != 'RIGHT') {
                    this.vx = -scl;
                    this.direct = dir;
                    switched = true;
                }  
                break;
            case 'UP':
                if (this.direct != 'DOWN') {
                    this.vy = -scl;
                    this.direct = dir;
                    switched = true;
                }  
                break;
            case 'RIGHT':
                if (this.direct != 'LEFT') {
                    this.vx = scl;
                    this.direct = dir;
                    switched = true;
                }
                break;
            case 'DOWN':
                if (this.direct != 'UP'){
                    this.vy = scl;
                    this.direct = dir;
                    switched = true;
                }
                break;
        }

        if (!switched) {
            this.vx = tempVx;
            this.vy = tempVy;
        }
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.size === this.tail.length)
            this.tail.pop();
        this.tail.unshift(new Point(this.x, this.y));
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        for (let p of this.tail)
            ctx.fillRect(p.x, p.y, scl, scl);
    }

    tryToEat(apple) {
        if (this.x !== apple.x) return;
        if (this.y !== apple.y) return;

        // How much the snake grows each time it eats an apple
        this.size += apple.big ? 30 : 3;
        apple.randLocation(this);
    }

    hitDetect() {
        if (this.x < 0 || this.y < 0)
            end(this.size);
        if (this.x > canvas.width - scl)
            end(this.size);
        if (this.y > canvas.height - scl)
            end(this.size);

        for (let p of this.tail) {
            if (this.tail.indexOf(p) === 0) continue;
            if (this.x === p.x && this.y === p.y) 
                end(this.size);
        }
    }
}