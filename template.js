// grab canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
// set the width and height to the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// grab main tag
const main = document.getElementById('main');

// the camera object
// this is before the collision objects so we can add camera.width to them and stuff
const camera = {
    rightBorder: 0.8,
    leftBorder: 0.2,
    x: 0,
    rightBound: canvas.width,
    leftBound: 0
}

// collision objects
const blocks = [];
const linkPos = [];

// grab the links
const links = document.getElementsByTagName('a');

// if we need debug tools, put an easy toggle here
const devTools = {
    devMode: false
}

// the player object
const player = {
    x: canvas.width / 2 - 25,
    y: 250,
    width: 50,
    height: 50,
    color: 'blue',
    velCapY: 10,
    moveSpeed: 10,
    flyHeight: 1,
    jumpHeight: 5,
    grav: 0.5
}

function render(object) {
    // if there is no color make it black for style
    if (!object.color) {
        ctx.fillStyle = 'black'
    } else {
        ctx.fillStyle = object.color;
    }

    // if they don't have coordinates, set them to 0
    if (!object.x) {
        object.x = 0;
    }
    if (!object.y) {
        object.y = 0;
    }

    // draw the object
    ctx.fillRect(object.x, object.y, object.width, object.height)
}

function runPhysics(object) {
    // if a value isn't set, make it zero to avoid crashes
    if (!object.x) {
        object.x = 0;
    }
    if (!object.y) {
        object.y = 0;
    }
    if (!object.velX) {
        object.velX = 0;
    }
    if (!object.velY) {
        object.velY = 0;
    }
    if (!object.grav) {
        object.grav = 0;
    }

    // add acceleration
    object.velY += object.grav

    // if moving both ways, set velocity to 0
    // otherwise move normally
    if (object.movingRight && object.movingLeft) {
        object.velX = 0;
    } else if (object.movingRight) {
        object.velX = object.moveSpeed;
    } else if (object.movingLeft) {
        object.velX = -1 * object.moveSpeed;
    } else {
        object.velX = 0;
    }

    // add y velocity when flying
    if (object.flying) {
        object.velY += object.flyHeight * -1;
    }

    // cap the velocity if needed
    if (object.velY > object.velCapY) {
        object.velY = object.velCapY;
    }
    if (object.velY < object.velCapY * -1) {
        object.velY = object.velCapY * -1;
    }

    // add velocities
    object.x += object.velX
    object.y += object.velY;

    // collide with the bottom of the canvas
    if (object.y + object.height > canvas.height) {
        // we also need to offset for the player's height
        object.y = canvas.height - object.height;

        // reset velocity and ground the player
        player.velY = 0;
        player.grounded = true;
    } else {
        player.grounded = false;
    }

    // block collisions
    for (let block of blocks) {
        // collide with the top of blocks
        if (object.y + object.height > block.y &&
            object.y < block.y &&
            object.y + object.height < block.y + block.height &&
            object.y < block.y + block.height &&
            object.x + object.width > block.x &&
            object.x < block.x + block.width &&
            object.velY > 0) {
            // we also need to offset for the player's height
            object.y = block.y - object.height;

            // reset velocity and ground the player
            object.velY = 0;
            object.grounded = true;
        }

        // collide with bottom of blocks
        if (object.y > block.y &&
            object.y + object.height > block.y &&
            object.y < block.y + block.height &&
            object.y + object.height > block.y + block.height &&
            object.x + object.width > block.x &&
            object.x < block.x + block.width &&
            object.velY < 0) {
            // we also need to offset for the block's height
            object.y = block.y + block.height;

            // reset velocity
            object.velY = 0;
        }

        // collide with left side of blocks
        if (object.x + object.width > block.x &&
            object.x < block.x &&
            object.y + object.height > block.y &&
            object.y < block.y + block.height &&
            object.velX > 0) {
            // we also need to offset for the player's width
            object.x = block.x - object.width;
            object.velX = 0;
        }

        // collide with right side of blocks
        if (object.x < block.x + block.width &&
            object.x + object.width > block.x &&
            object.y + object.height > block.y &&
            object.y < block.y + block.height &&
            object.velX < 0) {
            // we also need to offset for the block's width
            object.x = block.x + block.width;
            object.velX = 0;
        }
    }

    // links collisions
    for (let i in linkPos) {
        // check if inside the link
        if (object.x + object.width > linkPos[i].x &&
            object.x < linkPos[i].x + linkPos[i].width &&
            object.y + object.height > linkPos[i].y &&
            object.y < linkPos[i].y + linkPos[i].height
        ) {
            player.hoveredLink = links[i].href;
            // we break so that if we have two links we don't delete a link on accident
            break;
        } else {
            delete player.hoveredLink;
        }
    }
}

function cameraLogic() {
    // check when the camera should move right
    if (player.x > canvas.width * camera.rightBorder && camera.x + canvas.width < camera.rightBound) {
        // lock player character
        player.x -= player.velX;

        // move the screen
        camera.x += player.velX;
    }

    // check when camera should move left
    if (player.x < canvas.width * camera.leftBorder && camera.x > camera.leftBound) {
        // lock player character
        player.x -= player.velX;

        // move the screen
        camera.x += player.velX;
    }

    // move objects to camera
    for (let block of blocks) {
        block.x = block.origX - camera.x;
    }
    for (let link of linkPos) {
        link.x = link.origX - camera.x;
    }
    main.style.left = `${(camera.x * -1) + camera.leftBound}px`;
}

document.addEventListener('keydown', (e) => {
    // check for jumping/flying
    if (e.key === 'w') {
        if (player.grounded) {
            player.velY -= player.jumpHeight;
            player.flying = true;
        } else {
            player.flying = true;
        }
    }

    // check for moving right
    if (e.key === 'd') {
        player.movingRight = true;
    }
    // check for moving left
    if (e.key === 'a') {
        player.movingLeft = true;
    }

    // check for link enter
    if (e.key === 'e' && player.hoveredLink) {
        window.location = player.hoveredLink;
    }
})

document.addEventListener('keyup', (e) => {
    // check for stop moving right
    if (e.key === 'd') {
        player.movingRight = false;
    }
    // check for stop moving left
    if (e.key === 'a') {
        player.movingLeft = false;
    }

    // check for stop flying
    if (e.key === 'w') {
        player.flying = false;
    }
})

function update() {
    // clear the screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // run the functions
    runPhysics(player);
    cameraLogic();
    // render every block
    for (let block of blocks) {
        render(block);
    }
    for (let link of linkPos) {
        render(link);
    }
    // we render player here so it's on top
    render(player);

    // run the frame again
    requestAnimationFrame(update);
}

// run the first frame
requestAnimationFrame(update);