// types.ts

export interface EnhancedPrompt {
  technique: string;
  prompt: string;
  explanation?: string;
}

export interface HistoryItem {
  id: string;
  originalPrompt: string;
  category: string;
  outputs: EnhancedPrompt[];
  timestamp: number;
  isFavorite?: boolean;
  tags?: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  originalPrompt: string; // Rich text
  category: string;
  isAutomatic: boolean;
  techniques: string[]; // Always store techniques, used only if !isAutomatic
  promptContext: string; // Used only if isAutomatic
}
