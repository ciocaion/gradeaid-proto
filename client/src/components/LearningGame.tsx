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
        const items = game.config.items;
        let draggedItem: number | null = null;
        let score = 0;

        p.setup = () => {
          const canvas = p.createCanvas(600, 400);
          canvas.parent(canvasRef.current!);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(16);
        };

        p.draw = () => {
          p.background(240);

          // Draw score
          p.fill(50);
          p.textAlign(p.RIGHT, p.TOP);
          p.text(`Score: ${score}`, p.width - 20, 20);

          // Draw instructions
          p.textAlign(p.CENTER, p.TOP);
          p.text(game.config.instructions, p.width/2, 20);

          // Draw game based on type
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
            p.fill(draggedItem === i ? 220 : 200, 220, 255);
            p.rect(leftX - 100, y, 200, itemHeight, 8);
            p.fill(50);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(item.value, leftX, y + itemHeight/2);

            // Draw target (matching) item
            p.fill(255, 220, 200);
            p.rect(rightX - 100, y, 200, itemHeight, 8);
            p.fill(50);
            p.text(item.matches!, rightX, y + itemHeight/2);

            // Check for match
            if (draggedItem === i) {
              p.line(
                p.mouseX, p.mouseY,
                leftX - 100 + 100, y + itemHeight/2
              );
            }
          });
        };

        const drawSortingGame = () => {
          const itemWidth = 100;
          const itemHeight = 50;
          const gap = 10;
          const startX = (p.width - items.length * (itemWidth + gap)) / 2;

          items.forEach((item, i) => {
            const x = startX + i * (itemWidth + gap);
            const y = p.height/2 - itemHeight/2;

            // Draw background
            p.fill(draggedItem === i ? 220 : 200, 220, 255);
            p.rect(x, y, itemWidth, itemHeight, 8);

            // Draw text
            p.fill(50);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(item.value, x + itemWidth/2, y + itemHeight/2);

            // Draw dragged item
            if (draggedItem === i) {
              p.fill(220, 220, 255, 200);
              p.rect(p.mouseX - itemWidth/2, p.mouseY - itemHeight/2, 
                     itemWidth, itemHeight, 8);
              p.fill(50);
              p.text(item.value, p.mouseX, p.mouseY);
            }
          });
        };

        p.mousePressed = () => {
          const itemHeight = 50;
          const itemWidth = game.type === 'matching' ? 200 : 100;
          const gap = game.type === 'matching' ? 20 : 10;

          items.forEach((_, i) => {
            const y = game.type === 'matching' ? 
              80 + i * (itemHeight + gap) :
              p.height/2 - itemHeight/2;

            const x = game.type === 'matching' ?
              p.width * 0.25 - 100 :
              (p.width - items.length * (itemWidth + gap)) / 2 + i * (itemWidth + gap);

            if (p.mouseX > x && p.mouseX < x + itemWidth &&
                p.mouseY > y && p.mouseY < y + itemHeight) {
              draggedItem = i;
            }
          });
        };

        p.mouseReleased = () => {
          if (draggedItem !== null) {
            if (game.type === 'sorting') {
              const currentPos = draggedItem;
              const correctPos = items[draggedItem].correctPosition;

              if (currentPos === correctPos) {
                score += 10;
                p.fill(100, 255, 100);
                p.textSize(24);
                p.text('Correct!', p.width/2, p.height - 50);
              }
            } else if (game.type === 'matching') {
              // Check if mouse is over the correct matching area
              const itemHeight = 50;
              const gap = 20;
              const rightX = p.width * 0.75;
              const y = 80 + draggedItem * (itemHeight + gap);

              if (p.mouseX > rightX - 100 && p.mouseX < rightX + 100 &&
                  p.mouseY > y && p.mouseY < y + itemHeight) {
                score += 10;
                p.fill(100, 255, 100);
                p.textSize(24);
                p.text('Match!', p.width/2, p.height - 50);
              }
            }
            draggedItem = null;
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
      </div>
      <div ref={canvasRef} className="border rounded-lg overflow-hidden bg-white shadow-sm" />
    </div>
  );
}