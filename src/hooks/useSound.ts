import { useCallback } from 'react';

const SOUNDS = {
  SWIPE: '/audio/sfx/swipe.mp3',
  NEXT: '/audio/sfx/swipe.mp3',
  REVEAL: '/audio/sfx/reveal.mp3',
  CLICK: '/audio/sfx/swipe.mp3',
  FLIP: '/audio/sfx/flip.mp3',
  CORRECT: '/audio/sfx/correct.mp3',
  INCORRECT: '/audio/sfx/incorrect.mp3',
  SCORE: '/audio/sfx/reveal.mp3',
  TRANSITION: '/audio/sfx/reveal.mp3',
};

export const useSound = () => {
  const playSound = useCallback((soundKey: keyof typeof SOUNDS) => {
    const audio = new Audio(SOUNDS[soundKey]);
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Audio playback failed:', err));
  }, []);

  return { playSound };
};
