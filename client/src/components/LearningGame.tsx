import { useEffect, useRef } from 'react';
import type p5 from 'p5';

interface GameItem {
  id: string;
  value: string;
  isCorrect?: boolean;
  points?: number;
}

interface GameConfig {
  items: GameItem[];
  instructions: string;
  gridSize: number;
  speed: number;
}

interface GameData {
  type: 'snake' | 'matching' | 'sorting';
  title: string;
  description: string;
  config: GameConfig;
}

interface LearningGameProps {
  game?: GameData;
  onComplete?: () => void;
}

const DEFAULT_GAME_CONFIG: GameConfig = {
  gridSize: 20,
  speed: 150,
  instructions: 'Use arrow keys to move. Collect 10 correct items to win! Wrong items will make you shorter.',
  items: []
};

export function LearningGame({ game, onComplete }: LearningGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!game || !game.config) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Game configuration is loading...
      </div>
    );
  }

  useEffect(() => {
    if (!canvasRef.current || !game?.config) return;

    let p5Instance: p5;

    // Only import p5 on the client side
    import('p5').then((p5Module) => {
      const P5 = p5Module.default;

      p5Instance = new P5((p: p5) => {
        const config: GameConfig = { ...DEFAULT_GAME_CONFIG, ...game.config };
        const gridSize = config.gridSize;
        const cellSize = 20;
        let snake: { x: number; y: number }[] = [];
        let direction = { x: 1, y: 0 };
        let food: { x: number; y: number; item: GameItem }[] = [];
        let score = 0;
        let correctCollected = 0;
        let gameOver = false;
        let gameWon = false;
        let speed = config.speed;
        let lastUpdate = 0;

        function spawnFood() {
          const availableItems = config.items.filter((item: GameItem) => 
            !food.some(f => f.item.id === item.id)
          );

          if (availableItems.length === 0) return;

          const item = availableItems[Math.floor(Math.random() * availableItems.length)];
          const position = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize),
            item
          };

          // Ensure food doesn't spawn on snake
          if (!snake.some(s => s.x === position.x && s.y === position.y)) {
            food.push(position);
          }
        }

        p.setup = () => {
          const canvas = p.createCanvas(gridSize * cellSize, gridSize * cellSize);
          canvas.parent(canvasRef.current!);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);

          // Initialize snake in the middle
          const midPoint = Math.floor(gridSize / 2);
          snake = [
            { x: midPoint, y: midPoint },
            { x: midPoint - 1, y: midPoint },
            { x: midPoint - 2, y: midPoint }
          ];

          // Spawn initial food
          for (let i = 0; i < 3; i++) {
            spawnFood();
          }
        };

        p.draw = () => {
          if (gameOver || gameWon) {
            p.background(220);
            p.fill(50);
            p.textSize(24);
            if (gameWon) {
              p.text('You Won! 🎉', p.width / 2, p.height / 2 - 30);
              p.text(`Correct Answers: ${correctCollected}/10`, p.width / 2, p.height / 2);
              if (onComplete) onComplete();
            } else {
              p.text('Game Over!', p.width / 2, p.height / 2 - 30);
            }
            p.textSize(16);
            p.text(`Final Score: ${score}`, p.width / 2, p.height / 2 + 10);
            p.text('Press SPACE to restart', p.width / 2, p.height / 2 + 60);
            return;
          }

          const now = p.millis();
          if (now - lastUpdate > speed) {
            updateGame();
            lastUpdate = now;
          }

          p.background(240);

          // Draw score and progress
          p.fill(50);
          p.textAlign(p.LEFT, p.TOP);
          p.textSize(16);
          p.text(`Score: ${score}`, 10, 10);
          p.text(`Progress: ${correctCollected}/10`, 10, 30);

          // Draw snake
          p.noStroke();
          snake.forEach((segment, i) => {
            const isHead = i === 0;
            p.fill(isHead ? p.color(100, 200, 100) : p.color(150, 220, 150));
            p.rect(segment.x * cellSize, segment.y * cellSize, cellSize - 1, cellSize - 1, 4);
          });

          // Draw food - all items in the same color
          food.forEach(f => {
            p.fill(p.color(100, 200, 255));
            p.rect(f.x * cellSize, f.y * cellSize, cellSize - 1, cellSize - 1, 4);
            p.fill(50);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(10);
            p.text(f.item.value, (f.x + 0.5) * cellSize, (f.y + 0.5) * cellSize);
          });
        };

        function updateGame() {
          // Move snake
          const newHead = {
            x: (snake[0].x + direction.x + gridSize) % gridSize,
            y: (snake[0].y + direction.y + gridSize) % gridSize
          };

          // Check self-collision
          if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            gameOver = true;
            return;
          }

          snake.unshift(newHead);

          // Check food collision
          const foodIndex = food.findIndex(f => f.x === newHead.x && f.y === newHead.y);
          if (foodIndex >= 0) {
            const eatenFood = food[foodIndex];
            score += eatenFood.item.points || 0;
            food.splice(foodIndex, 1);
            spawnFood();

            if (eatenFood.item.isCorrect) {
              correctCollected++;
              if (correctCollected >= 10) {
                gameWon = true;
                return;
              }
            } else {
              // Remove tail for incorrect items
              snake.pop();
              snake.pop();
            }
          } else {
            snake.pop();
          }
        }

        p.keyPressed = () => {
          if ((gameOver || gameWon) && p.keyCode === 32) { // 32 is SPACE
            // Reset game
            score = 0;
            correctCollected = 0;
            gameOver = false;
            gameWon = false;
            const midPoint = Math.floor(gridSize / 2);
            snake = [
              { x: midPoint, y: midPoint },
              { x: midPoint - 1, y: midPoint },
              { x: midPoint - 2, y: midPoint }
            ];
            direction = { x: 1, y: 0 };
            food = [];
            for (let i = 0; i < 3; i++) {
              spawnFood();
            }
            return;
          }

          if (p.keyCode === p.UP_ARROW && direction.y !== 1) {
            direction = { x: 0, y: -1 };
          } else if (p.keyCode === p.DOWN_ARROW && direction.y !== -1) {
            direction = { x: 0, y: 1 };
          } else if (p.keyCode === p.LEFT_ARROW && direction.x !== 1) {
            direction = { x: -1, y: 0 };
          } else if (p.keyCode === p.RIGHT_ARROW && direction.x !== -1) {
            direction = { x: 1, y: 0 };
          }
        };
      });
    });

    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, [game, onComplete]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">{game.title || 'Learning Game'}</h3>
        <p className="text-muted-foreground">{game.description || 'Collect the correct items to score points!'}</p>
        <p className="text-sm mt-2">{game.config.instructions || DEFAULT_GAME_CONFIG.instructions}</p>
      </div>
      <div ref={canvasRef} className="border rounded-lg overflow-hidden bg-white shadow-sm" />
    </div>
  );
}