import { useEffect, useRef } from 'react';
import type { GameData } from '@shared/types';

interface LearningGameProps {
  game: GameData;
}

export function LearningGame({ game }: LearningGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Only import p5 on the client side
    import('p5').then((p5Module) => {
      const p5 = p5Module.default;

      new p5((p: any) => {
        const items = game.config.items;
        let draggedItem: number | null = null;
        let score = 0;

        p.setup = () => {
          const canvas = p.createCanvas(600, 400);
          canvas.parent(canvasRef.current!);
          p.textAlign(p.CENTER, p.CENTER);
        };

        p.draw = () => {
          p.background(240);
          
          // Draw instructions
          p.textSize(16);
          p.fill(0);
          p.text(game.config.instructions, p.width/2, 30);

          // Draw score
          p.text(`Score: ${score}`, p.width - 60, 30);

          // Draw items based on game type
          if (game.type === 'matching') {
            drawMatchingGame();
          } else if (game.type === 'sorting') {
            drawSortingGame();
          }
        };

        const drawMatchingGame = () => {
          const itemHeight = 50;
          const gap = 20;
          const leftX = p.width * 0.25;
          const rightX = p.width * 0.75;

          items.forEach((item, i) => {
            const y = 80 + i * (itemHeight + gap);
            
            // Draw left item
            p.fill(200, 220, 255);
            p.rect(leftX - 100, y, 200, itemHeight);
            p.fill(0);
            p.text(item.value, leftX, y + itemHeight/2);

            // Draw right item (matching target)
            p.fill(255, 220, 200);
            p.rect(rightX - 100, y, 200, itemHeight);
            p.fill(0);
            p.text(item.matches!, rightX, y + itemHeight/2);
          });
        };

        const drawSortingGame = () => {
          const itemWidth = 80;
          const itemHeight = 50;
          const startX = (p.width - items.length * (itemWidth + 10)) / 2;

          items.forEach((item, i) => {
            const x = startX + i * (itemWidth + 10);
            const y = p.height/2;
            
            p.fill(draggedItem === i ? 200 : 255);
            p.rect(x, y, itemWidth, itemHeight);
            p.fill(0);
            p.text(item.value, x + itemWidth/2, y + itemHeight/2);
          });
        };

        p.mousePressed = () => {
          const checkHit = (x: number, y: number, itemX: number, itemY: number) => {
            return p.dist(x, y, itemX, itemY) < 40;
          };

          items.forEach((_, i) => {
            if (checkHit(p.mouseX, p.mouseY, p.width/2, 100 + i * 60)) {
              draggedItem = i;
            }
          });
        };

        p.mouseReleased = () => {
          if (draggedItem !== null) {
            // Check if item was dropped in correct position
            if (game.type === 'sorting') {
              const item = items[draggedItem];
              if (item.correctPosition === draggedItem) {
                score += 10;
              }
            }
            draggedItem = null;
          }
        };
      });
    });

    return () => {
      // Cleanup p5 instance when component unmounts
      if (canvasRef.current) {
        canvasRef.current.innerHTML = '';
      }
    };
  }, [game]);

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{game.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
      <div ref={canvasRef} className="border rounded-lg overflow-hidden" />
    </div>
  );
}
