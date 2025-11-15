import { create } from 'zustand';

interface MoodEntry {
  id: string;
  mood_value: number;
  mood_emoji: string;
  mood_color: string;
  factors: {
    sleep: number;
    stress: number;
    energy: number;
  };
  journal_text?: string;
  timestamp: string;
}

interface Prediction {
  id: string;
  prediction_date: string;
  predicted_mood: number;
  confidence: number;
  reasoning: string;
  coping_strategies: string[];
}

interface MoodStore {
  moods: MoodEntry[];
  predictions: Prediction[];
  setMoods: (moods: MoodEntry[]) => void;
  addMood: (mood: MoodEntry) => void;
  setPredictions: (predictions: Prediction[]) => void;
  addPrediction: (prediction: Prediction) => void;
}

export const useMoodStore = create<MoodStore>((set) => ({
  moods: [],
  predictions: [],
  setMoods: (moods) => set({ moods }),
  addMood: (mood) => set((state) => ({ moods: [mood, ...state.moods] })),
  setPredictions: (predictions) => set({ predictions }),
  addPrediction: (prediction) => set((state) => ({ predictions: [prediction, ...state.predictions] })),
}));