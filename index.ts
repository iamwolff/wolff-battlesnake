// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com

import runServer from './server';
import { Coord, GameState, InfoResponse, MoveResponse } from './types';

// info is called when you create your Battlesnake on play.battlesnake.com
// and controls your Battlesnake's appearance
// TIP: If you open your Battlesnake URL in a browser you should see this data
function info(): InfoResponse {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "",       // TODO: Your Battlesnake Username
    color: "#888888", // TODO: Choose color
    head: "default",  // TODO: Choose head
    tail: "default",  // TODO: Choose tail
  };
}

// start is called when your Battlesnake begins a game
function start(gameState: GameState): void {
  console.log("GAME START");
}

// end is called when your Battlesnake finishes a game
function end(gameState: GameState): void {
  console.log("GAME OVER\n");
}

// move is called on every turn and returns your next move
// Valid moves are "up", "down", "left", or "right"
// See https://docs.battlesnake.com/api/example-move for available data
function move(gameState: GameState): MoveResponse {

  const UP = 0;
  const RIGHT = 1;
  const DOWN = 2;
  const LEFT = 3;

  //let moveWeight = [0,0,0,0];

  let moveWeight: { [key: string]: number; } = {
    up: 0,
    right: 0,
    down: 0,
    left: 0,
  };

  let myHead = gameState.you.body[0];
  let myNeck = gameState.you.body[1];

  let moveUp = { x: myHead.x, y: myHead.y + 1 } as Coord;
  let moveRight = { x: myHead.x + 1, y: myHead.y } as Coord;
  let moveDown = { x: myHead.x, y: myHead.y - 1 } as Coord;
  let moveLeft = { x: myHead.x - 1, y: myHead.y } as Coord;

  // if (myNeck.x === moveLeft.x) moveWeight.left -= 1000;
  // if (myNeck.x === moveRight.x) moveWeight.right -= 1000;
  // if (myNeck.y === moveUp.y) moveWeight.up -= 1000;
  // if (myNeck.y === moveDown.y) moveWeight.down -= 1000;

  if (myHead.x === 0) moveWeight.left -= 1000;
  if (myHead.x === gameState.board.width - 1) moveWeight.right -= 1000;
  if (myHead.y === 0) moveWeight.down -= 1000;
  if (myHead.y === gameState.board.height - 1) moveWeight.up -= 1000;

  // don't move to edge of the board
  if (moveUp.y === gameState.board.height - 1) moveWeight.up -= 100;
  if (moveRight.x === gameState.board.width - 1) moveWeight.right -= 100;
  if (moveDown.y === 0) moveWeight.down -= 100;
  if (moveLeft.x === 0) moveWeight.left -= 100;

  gameState.board.snakes.forEach(snake => {
  
    if (snake.body.slice(0, -1).some(bodyCoord => bodyCoord.x === moveUp.x && bodyCoord.y === moveUp.y)) {
      moveWeight.up -= 1000;
    }
    if (snake.body.slice(0, -1).some(bodyCoord => bodyCoord.x === moveRight.x && bodyCoord.y === moveRight.y)) {
      moveWeight.right -= 1000;
    }
    if (snake.body.slice(0, -1).some(bodyCoord => bodyCoord.x === moveDown.x && bodyCoord.y === moveDown.y)) {
      moveWeight.down -= 1000;
    }
    if (snake.body.slice(0, -1).some(bodyCoord => bodyCoord.x === moveLeft.x && bodyCoord.y === moveLeft.y)) {
      moveWeight.left -= 1000;
    }

    // todo dont go NEXT to the other snakes head
    if (snake.id !== gameState.you.id && snake.body.length >= gameState.you.body.length) {
      let otherHead = snake.body[0];

      if (Math.abs(moveUp.x - otherHead.x) + Math.abs(moveUp.y - otherHead.y) === 1) moveWeight.up -= 500;
      if (Math.abs(moveRight.x - otherHead.x) + Math.abs(moveRight.y - otherHead.y) === 1) moveWeight.right -= 500;
      if (Math.abs(moveDown.x - otherHead.x) + Math.abs(moveDown.y - otherHead.y) === 1) moveWeight.down -= 500;
      if (Math.abs(moveLeft.x - otherHead.x) + Math.abs(moveLeft.y - otherHead.y) === 1) moveWeight.left -= 500;
    }
  });

  if (gameState.board.food.length > 0) {
    console.log("looking for closest food");
    const closestFood = gameState.board.food
      .reduce((prev, curr) => {
        var prevDist = Math.abs(myHead.x - prev.x) + Math.abs(myHead.y - prev.y);
        var currDist = Math.abs(myHead.x - curr.x) + Math.abs(myHead.y - curr.y);
        return currDist < prevDist ? curr : prev;
      }, gameState.board.food[0]);
    console.log(myHead);
    console.log(closestFood);

    if (closestFood.x < myHead.x) moveWeight.left += 200;
    if (closestFood.x > myHead.x) moveWeight.right += 200;
    if (closestFood.y < myHead.y) moveWeight.down += 200;
    if (closestFood.y > myHead.y) moveWeight.up += 200;
  }

  // try to move towards food
  // gameState.board.food.forEach(f => {
  //   if (f.x === moveUp.x && f.y === moveUp.y) moveWeight.up += 200;
  //   if (f.x === moveRight.x && f.y === moveRight.y) moveWeight.right += 200;
  //   if (f.x === moveDown.x && f.y === moveDown.y) moveWeight.down += 200;
  //   if (f.x === moveLeft.x && f.y === moveLeft.y) moveWeight.left += 200;
  // });


  console.log(moveWeight);

  let bestMoveWeight = Object.keys(moveWeight).reduce((a, b) => moveWeight[a] > moveWeight[b] ? a : b);
  
  const bestMoves = Object.keys(moveWeight).filter(key => moveWeight[key] === moveWeight[bestMoveWeight]);

  const nextMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end
});
