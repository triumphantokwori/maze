const {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Events
} = Matter;

const cellsX  = 20;
const cellsY  = 20;
const width  = window.innerWidth;
const height = window.innerHeight;
const unitLengthX = width/cellsX;
const unitLengthY = height/cellsY;


const engine  = Engine.create();
// engine.world.gravity.y = 0;
// engine.world.gravity.x = 0;
const {world} = engine;
const render  = Render.create({
    element: document.body,
    engine : engine,
    options: {
        wireframes : false,
        width,
        height
    }
}); 
Render.run(render);
Runner.run(Runner.create(), engine);

function pickRandomColor() {
    let hexColor = Math.floor(Math.random()*16777215).toString(16);
    let randomColor = '#'+hexColor;
    return randomColor
};

const walls = [
    Bodies.rectangle(width/2, 0, width, 15, {isStatic: true, render : {fillStyle : 'grey'}}),
    Bodies.rectangle(width/2, height, width, 15, {isStatic: true, render : {fillStyle : 'grey'}}),
    Bodies.rectangle(0, height/2, 15, height, {isStatic: true, render : {fillStyle : 'grey'}}),
    Bodies.rectangle(width, height/2, 15, height, {isStatic: true, render : {fillStyle : 'grey'}}),
];
World.add(world, walls);



const shuffle = (arr) => {
    let arrLength = arr.length;

    while (arrLength > 0) {
        const index = Math.floor(Math.random() * arrLength);
        arrLength--;

        const temp        = arr[arrLength];
        arr   [arrLength] = arr[index];
        arr   [index]     = temp;
    }
    return arr;
}

const grid = Array(cellsY).fill(null).map(()=>Array(cellsX).fill(false));

const verticals   = Array(cellsY).fill(null).map(()=>Array(cellsX-1).fill(false));
const horizontals = Array(cellsY-1).fill(null).map(()=>Array(cellsX).fill(false));

const startRow    = Math.floor(Math.random() * cellsY);
const startColumn = Math.floor(Math.random() * cellsX);

const mazeSelect = (row, column) => {
    if (grid[row][column]) {
        return;
    }

    grid[row][column] = true;

    const neighborCells = shuffle([
        [row-1, column, 'up'],
        [row, column+1, 'right'],
        [row+1, column, 'down'],
        [row, column-1, 'left']
    ]);

    for (let neighbor of neighborCells) {
        const [nextRow, nextColumn, direction] = neighbor;

        if (
            nextRow < 0 ||
            nextRow >= cellsY ||
            nextColumn < 0 ||
            nextColumn >= cellsX
        ) {
            continue;
        }

        if (grid[nextRow][nextColumn]) {
            continue;
        }

        if (direction === 'left') {
            verticals[row][column-1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if (direction === 'up') {
            horizontals[row-1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true; 
        }

        mazeSelect(nextRow, nextColumn);
    }

};

mazeSelect(startRow, startColumn);

horizontals.forEach((row, rowIndex)=> {
    row.forEach((openWall, columnIndex) => {
        if (openWall) {
            return;
        }

        const horizontalWall = Bodies.rectangle(
            (columnIndex*unitLengthX) + (unitLengthX/2),
            (rowIndex*unitLengthY) + unitLengthY,
            unitLengthX, 5, {
                label : 'wall',
                isStatic: true,
                render : {
                    fillStyle : pickRandomColor()
                }
            }
        );
        World.add(world, horizontalWall);
    })
})

verticals.forEach((row, rowIndex) => {
    row.forEach((openWall, columnIndex) => {
        if (openWall) {
            return;
        }

        const verticalWall = Bodies.rectangle(
            (columnIndex*unitLengthX) + unitLengthX,
            (rowIndex*unitLengthY) + (unitLengthY/2),
            5, unitLengthY, {
                label : 'wall',
                isStatic: true,
                render : {
                    fillStyle : pickRandomColor()
                }
            }
        );
        World.add(world, verticalWall);
    });
});

const goal = Bodies.rectangle(
    width - (unitLengthX + (unitLengthX/2)),
    height - (unitLengthY + (unitLengthY/2)),
    unitLengthX*0.7, unitLengthY*0.7, {
        isStatic : true,
        label : 'goal',
        render : {
            fillStyle : 'aquamarine'
        }
    }
);
World.add(world, goal);

const ballRadius = (Math.min(unitLengthX, unitLengthY))/4;
const ball = Bodies.circle(
    unitLengthX/2, unitLengthY/2, ballRadius, {
        label : 'ball', 
        render : {
            fillStyle : 'tomato'
        }
    }
);
World.add(world, ball);

document.addEventListener('keydown', event => {
    const {x,y} = ball.velocity;

    if (event.key==='w' || event.key==='ArrowUp') {
        Body.setVelocity(ball, {x,y:y-5});
    }
    if (event.key==='a' || event.key==='ArrowLeft') {
        Body.setVelocity(ball, {x:x-5,y});
    }
    if (event.key==='s' || event.key==='ArrowDown') {
        Body.setVelocity(ball, {x,y:y+5});
    }
    if (event.key==='d' || event.key==='ArrowRight') {
        Body.setVelocity(ball, {x:x+5,y});
    }
})

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(
        collision => {
            const labels = ['ball', 'goal'];

            if(
                labels.includes(collision.bodyA.label) &&
                labels.includes(collision.bodyB.label)
            ) {
                document.querySelector('.winner').classList.remove('hidden');
                // const replay = document.querySelector('#replay');
                // replay.addEventListener('click', ()=>{
                //     window.location.reload();
                // })
                world.gravity.y = 1;
                world.bodies.forEach(body => {
                    if (body.label === 'wall') {
                        Body.setStatic(body, false);
                    }
                });
            }
        }
    )
});