import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Flashcards
  getFlashcards: () => ipcRenderer.invoke('get-flashcards'),
  addFlashcard: (card: any) => ipcRenderer.invoke('add-flashcard', card),
  deleteFlashcard: (id: string) => ipcRenderer.invoke('delete-flashcard', id),
  updateFlashcard: (card: any) => ipcRenderer.invoke('update-flashcard', card),
  getSets: () => ipcRenderer.invoke('get-sets'),
  addSet: (set: any) => ipcRenderer.invoke('add-set', set),
  
  // Quizzes
  getQuizzes: () => ipcRenderer.invoke('get-quizzes'),
  getQuizQuestions: () => ipcRenderer.invoke('get-quiz-questions'),
  addQuizSet: (set: any) => ipcRenderer.invoke('add-quiz-set', set),
  addQuizQuestion: (q: any) => ipcRenderer.invoke('add-quiz-question', q),
  deleteQuizSet: (id: string) => ipcRenderer.invoke('delete-quiz-set', id),

  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message));
  },
});
