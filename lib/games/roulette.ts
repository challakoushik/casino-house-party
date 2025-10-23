// Roulette game logic

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export function spinWheel(): number {
  return Math.floor(Math.random() * 37); // 0-36
}

export function isRed(number: number): boolean {
  return RED_NUMBERS.includes(number);
}

export function isBlack(number: number): boolean {
  return BLACK_NUMBERS.includes(number);
}

export function calculateRoulettePayout(
  betType: string,
  betValue: number | number[] | undefined,
  winningNumber: number,
  betAmount: number
): number {
  if (winningNumber === 0) {
    // 0 only wins on straight 0 bets
    if (betType === 'number' && betValue === 0) {
      return betAmount * 35; // 35:1
    }
    return 0;
  }

  switch (betType) {
    case 'number':
      if (betValue === winningNumber) {
        return betAmount * 35; // 35:1
      }
      return 0;
    
    case 'red':
      if (isRed(winningNumber)) {
        return betAmount; // 1:1
      }
      return 0;
    
    case 'black':
      if (isBlack(winningNumber)) {
        return betAmount; // 1:1
      }
      return 0;
    
    case 'odd':
      if (winningNumber % 2 === 1) {
        return betAmount; // 1:1
      }
      return 0;
    
    case 'even':
      if (winningNumber % 2 === 0) {
        return betAmount; // 1:1
      }
      return 0;
    
    case 'low':
      if (winningNumber >= 1 && winningNumber <= 18) {
        return betAmount; // 1:1
      }
      return 0;
    
    case 'high':
      if (winningNumber >= 19 && winningNumber <= 36) {
        return betAmount; // 1:1
      }
      return 0;
    
    case 'dozen':
      const dozen = Math.ceil(winningNumber / 12);
      if (betValue === dozen) {
        return betAmount * 2; // 2:1
      }
      return 0;
    
    case 'column':
      const column = winningNumber % 3 === 0 ? 3 : winningNumber % 3;
      if (betValue === column) {
        return betAmount * 2; // 2:1
      }
      return 0;
    
    default:
      return 0;
  }
}
