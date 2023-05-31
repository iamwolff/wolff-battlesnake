import runServer from './server';
import { Coord, Game, GameState, InfoResponse, MoveResponse } from './types';

function info(): InfoResponse {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "awolff",
    color: "#6699CC",
    head: "safe",
    tail: "round-bum",
  };
}

function start(gameState: GameState): void {
  console.log("GAME START");
}

function end(gameState: GameState): void {
  console.log("GAME OVER\n");
}

function move(gameState: GameState): MoveResponse {

  const myHead = gameState.you.body[0];

  const myMoves: { [key: string]: WeightedCoord } = {
    up: { weight: 0, x: myHead.x, y: myHead.y + 1 },
    right: { weight: 0, x: myHead.x + 1, y: myHead.y },
    down: { weight: 0, x: myHead.x, y: myHead.y - 1 },
    left: { weight: 0, x: myHead.x - 1, y: myHead.y },
  };

  const closestFood = gameState.board.food.length > 0 ?
     gameState.board.food
      .reduce((prev, curr) => {
        var prevDist = distance(myHead, prev);
        var currDist = distance(myHead, curr);
        return currDist < prevDist ? curr : prev;
      }, gameState.board.food[0]) : null;

  Object.keys(myMoves).forEach(moveName => {

    const myMove = myMoves[moveName];

    if (isOffBoard(myMove, gameState)) myMove.weight -= 1000;

    if (isOnSnake(myMove, gameState)) myMove.weight -= 1000;

    if (isNextToOtherSnakeHead(myMove, gameState)) myMove.weight -= 500;

    // TODO: if next to another <smaller> snakehead, then ++++ move there!

    //if (isDistanceFromEdge(myMove, gameState, 0)) myMove.weight -= 100;

    //if (isDistanceFromEdge(myMove, gameState, 1)) myMove.weight -= 50;

    if (floodFillCount(myMove, [], gameState).length < gameState.you.body.length) myMove.weight -= 800;
  });

  let huntFoodThreshold = 100;
  if (closestFood && gameState.you.health <= huntFoodThreshold) {
    if (closestFood.x < myHead.x) myMoves.left.weight += 200;
    if (closestFood.x > myHead.x) myMoves.right.weight += 200;
    if (closestFood.y < myHead.y) myMoves.down.weight += 200;
    if (closestFood.y > myHead.y) myMoves.up.weight += 200;
  }

  const bestMoveWeight = Object.keys(myMoves).reduce((a, b) => myMoves[a].weight > myMoves[b].weight ? a : b);
  
  const bestMoves = Object.keys(myMoves).filter(key => myMoves[key].weight === myMoves[bestMoveWeight].weight);

  const nextMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

function isOffBoard(coord: Coord, gameState: GameState): boolean {
  return coord.x < 0 || 
        coord.y < 0 || 
        coord.x > gameState.board.width - 1 ||
        coord.y > gameState.board.height - 1;
}

function isDistanceFromEdge(coord: Coord, gameState: GameState, n: number): boolean {
  return coord.x === n || 
        coord.y === n || 
        coord.x === gameState.board.width - 1 - n ||
        coord.y === gameState.board.height - 1 - n;
}

function isOnSnake(coord: Coord, gameState: GameState): boolean {
  return gameState.board.snakes.some(snake => {
    return snake.body.slice(0, -1).some(body => body.x === coord.x && body.y === coord.y);
  });
}

function isNextToOtherSnakeHead(coord: Coord, gameState: GameState): boolean {
  return gameState.board.snakes
    .filter(snake => snake.id !== gameState.you.id)
    .filter(snake => snake.body.length >= gameState.you.body.length)
    .some(snake => {
      return distance(snake.body[0], coord) === 1;
    });
}

function distance(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function floodFillCount(coord: Coord, coords: Coord[], gameState: GameState): Coord[] {
  
  if (coords.length > 30) return coords;

  // TODO: add if another snake head near floodfill, then consider it blocked

  if (!coords.some(c => c.x === coord.x && c.y === coord.y) && !isOffBoard(coord, gameState) && !isOnSnake(coord, gameState)) {
    coords.push(coord);
    floodFillCount({x: coord.x, y: coord.y + 1 }, coords, gameState);
    floodFillCount({x: coord.x + 1, y: coord.y }, coords, gameState);
    floodFillCount({x: coord.x, y: coord.y - 1 }, coords, gameState);
    floodFillCount({x: coord.x - 1, y: coord.y }, coords, gameState);
  }
  
  return coords;
}


runServer({
  info: info,
  start: start,
  move: move,
  end: end
});

interface WeightedCoord extends Coord {
  weight: number;
};