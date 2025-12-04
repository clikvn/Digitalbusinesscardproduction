import { useState, useEffect } from "react";

// Hook to calculate optimal font size for name based on available space
export function useNameFontSize(cardHeight: number, cardWidth: number, name: string) {
  const [fontSize, setFontSize] = useState(24);
  const [nameLines, setNameLines] = useState(1);
  
  useEffect(() => {
    if (!name || cardHeight === 0 || cardWidth === 0) return;
    
    // Calculate constraints based on cardHeight breakpoints
    let nameHeight: number;
    let nameWidth: number;
    let maxLines: number;
    
    if (cardHeight < 320) {
      nameHeight = cardHeight - 272;
      nameWidth = cardWidth - 48;
      maxLines = 1;
    } else if (cardHeight < 350) {
      nameHeight = cardHeight - 290;
      nameWidth = cardWidth - 48;
      maxLines = 1;
    } else if (cardHeight < 400) {
      nameHeight = cardHeight - 308;
      nameWidth = cardWidth - 48;
      maxLines = 2;
    } else {
      nameHeight = cardHeight - 326;
      nameWidth = cardWidth - 48;
      maxLines = 2;
    }
    
    // Ensure positive values
    nameHeight = Math.max(nameHeight, 10);
    nameWidth = Math.max(nameWidth, 50);
    
    // Create canvas for text measurement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Find the largest font size that fits
    let optimalSize = 24;
    const minSize = 12;
    const maxSize = 60;
    
    for (let testSize = maxSize; testSize >= minSize; testSize -= 1) {
      ctx.font = `bold ${testSize}px Inter`;
      const metrics = ctx.measureText(name);
      const textWidth = metrics.width;
      
      // Calculate line height (1.17 as specified in the original code)
      const lineHeight = testSize * 1.17;
      
      // Check if text fits in one line
      if (maxLines === 1) {
        if (textWidth <= nameWidth && lineHeight <= nameHeight) {
          optimalSize = testSize;
          setNameLines(1);
          break;
        }
      } else {
        // For 2 lines, check if text fits when wrapped
        const words = name.split(' ');
        let lines = 1;
        let currentLineWidth = 0;
        
        for (const word of words) {
          const wordWidth = ctx.measureText(word + ' ').width;
          if (currentLineWidth + wordWidth > nameWidth) {
            lines++;
            currentLineWidth = wordWidth;
          } else {
            currentLineWidth += wordWidth;
          }
        }
        
        const totalHeight = lineHeight * lines;
        
        if (lines <= maxLines && totalHeight <= nameHeight) {
          optimalSize = testSize;
          setNameLines(lines);
          break;
        }
      }
    }
    
    setFontSize(optimalSize);
    // console.log('Name font calculation:', { 
    //   cardHeight, 
    //   nameHeight, 
    //   nameWidth, 
    //   maxLines, 
    //   fontSize: optimalSize,
    //   calculatedLines: nameLines
    // });
    
  }, [cardHeight, cardWidth, name]);
  
  return { fontSize, nameLines };
}
