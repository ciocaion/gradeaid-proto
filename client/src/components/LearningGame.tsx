import { useEffect, useRef } from 'react';
import type { GameData } from '@shared/types';
import type p5 from 'p5';

interface LearningGameProps {
  game: GameData;
}

export function LearningGame({ game }: LearningGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let p5Instance: p5;

    // Only import p5 on the client side
    import('p5').then((p5Module) => {
      const P5 = p5Module.default;

      p5Instance = new P5((p: p5) => {
        const gridSize = game.config.gridSize || 20;
        const cellSize = 20;
        let snake: { x: number; y: number }[] = [];
        let direction = { x: 1, y: 0 };
        let food: { x: number; y: number; item: any }[] = [];
        let score = 0;
        let gameOver = false;
        let speed = game.config.speed || 150;
        let lastUpdate = 0;

        function spawnFood() {
          const availableItems = game.config.items.filter(item => 
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
          if (gameOver) {
            p.background(220);
            p.fill(50);
            p.textSize(24);
            p.text('Game Over!', p.width/2, p.height/2 - 30);
            p.textSize(16);
            p.text(`Final Score: ${score}`, p.width/2, p.height/2 + 10);
            p.text('Press SPACE to restart', p.width/2, p.height/2 + 40);
            return;
          }

          const now = p.millis();
          if (now - lastUpdate > speed) {
            updateGame();
            lastUpdate = now;
          }

          p.background(240);

          // Draw score
          p.fill(50);
          p.textAlign(p.LEFT, p.TOP);
          p.textSize(16);
          p.text(`Score: ${score}`, 10, 10);

          // Draw snake
          p.noStroke();
          snake.forEach((segment, i) => {
            const isHead = i === 0;
            p.fill(isHead ? p.color(100, 200, 100) : p.color(150, 220, 150));
            p.rect(segment.x * cellSize, segment.y * cellSize, cellSize - 1, cellSize - 1, 4);
          });

          // Draw food
          food.forEach(f => {
            p.fill(f.item.isCorrect ? p.color(100, 200, 255) : p.color(255, 100, 100));
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

            if (!eatenFood.item.isCorrect) {
              // Remove tail for incorrect items
              snake.pop();
              snake.pop();
            }
          } else {
            snake.pop();
          }
        }

        p.keyPressed = () => {
          if (gameOver && p.keyCode === p.SPACE) {
            // Reset game
            score = 0;
            gameOver = false;
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
  }, [game]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">{game.title}</h3>
        <p className="text-muted-foreground">{game.description}</p>
        <p className="text-sm mt-2">{game.config.instructions}</p>
      </div>
      <div ref={canvasRef} className="border rounded-lg overflow-hidden bg-white shadow-sm" />
    </div>
  );
}