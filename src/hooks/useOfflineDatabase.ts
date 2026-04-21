import { useState, useEffect, useCallback } from 'react';
import { Flashcard, FlashcardSet, QuizQuestion, QuizSet } from '../types';

declare global {
  interface Window {
    electronAPI: {
      getFlashcards: () => Promise<any[]>;
      addFlashcard: (card: any) => Promise<any>;
      deleteFlashcard: (id: string) => Promise<any>;
      updateFlashcard: (card: any) => Promise<any>;
      getSets: () => Promise<any[]>;
      addSet: (set: any) => Promise<any>;
      
      getQuizzes: () => Promise<any[]>;
      getQuizQuestions: () => Promise<any[]>;
      addQuizSet: (set: any) => Promise<any>;
      addQuizQuestion: (q: any) => Promise<any>;
      deleteQuizSet: (id: string) => Promise<any>;
    };
  }
}

export const useOfflineDatabase = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!window.electronAPI) {
      // Fallback for web environment if needed
      const savedSets = localStorage.getItem('flashcard_sets');
      setSets(savedSets ? JSON.parse(savedSets) : []);
      const savedQuizzes = localStorage.getItem('quiz_sets');
      setQuizSets(savedQuizzes ? JSON.parse(savedQuizzes) : []);
      setIsLoading(false);
      return;
    }

    try {
      // Load Flashcards
      const dbSets = await window.electronAPI.getSets();
      const dbCards = await window.electronAPI.getFlashcards();

      const combinedSets: FlashcardSet[] = dbSets.map(s => ({
        ...s,
        createdAt: s.created_at || Date.now(),
        cards: dbCards.filter(c => c.set_id === s.id).map(c => ({
          ...c,
          createdAt: c.created_at || Date.now(),
        })),
      }));
      setSets(combinedSets);

      // Load Quizzes
      const dbQuizzes = await window.electronAPI.getQuizzes();
      const dbQuestions = await window.electronAPI.getQuizQuestions();

      const combinedQuizzes: QuizSet[] = dbQuizzes.map(q => ({
        id: q.id,
        title: q.title,
        timeLimit: q.time_limit,
        allowedRetries: q.allowed_retries,
        createdAt: q.created_at || Date.now(),
        questions: dbQuestions.filter(quest => quest.set_id === q.id).map(quest => ({
          id: quest.id,
          question: quest.question,
          options: JSON.parse(quest.options),
          correctOptionIndices: JSON.parse(quest.correct_option_indices),
          createdAt: quest.created_at || Date.now(),
        })),
      }));
      setQuizSets(combinedQuizzes);

    } catch (error) {
      console.error('Failed to load data from SQLite:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Flashcards CRUD
  const saveSet = async (title: string) => {
    const newSet: FlashcardSet = {
      id: crypto.randomUUID(),
      title,
      cards: [],
      createdAt: Date.now(),
    };
    if (window.electronAPI) await window.electronAPI.addSet({ id: newSet.id, title: newSet.title, description: '', language: 'en' });
    setSets(prev => [newSet, ...prev]);
    return newSet;
  };

  const saveCard = async (setId: string, question: string, answer: string) => {
    const newCard: Flashcard = { id: crypto.randomUUID(), question, answer, createdAt: Date.now() };
    if (window.electronAPI) await window.electronAPI.addFlashcard({ id: newCard.id, question: newCard.question, answer: newCard.answer, set_id: setId });
    setSets(prev => prev.map(s => s.id === setId ? { ...s, cards: [newCard, ...s.cards] } : s));
    return newCard;
  };

  // Quizzes CRUD
  const saveQuizSet = async (set: Partial<QuizSet>) => {
    const newSet: QuizSet = {
      id: crypto.randomUUID(),
      title: set.title || 'Untitled Quiz',
      questions: [],
      timeLimit: set.timeLimit || 0,
      allowedRetries: set.allowedRetries || 0,
      createdAt: Date.now(),
    };
    if (window.electronAPI) await window.electronAPI.addQuizSet(newSet);
    setQuizSets(prev => [newSet, ...prev]);
    return newSet;
  };

  const saveQuizQuestion = async (setId: string, q: Partial<QuizQuestion>) => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question: q.question || '',
      options: q.options || [],
      correctOptionIndices: q.correctOptionIndices || [0],
      createdAt: Date.now(),
    };
    if (window.electronAPI) await window.electronAPI.addQuizQuestion({ ...newQuestion, set_id: setId });
    setQuizSets(prev => prev.map(s => s.id === setId ? { ...s, questions: [newQuestion, ...s.questions] } : s));
    return newQuestion;
  };

  return {
    sets,
    quizSets,
    setSets,
    setQuizSets,
    isLoading,
    saveSet,
    saveCard,
    saveQuizSet,
    saveQuizQuestion,
    refresh: loadData
  };
};
