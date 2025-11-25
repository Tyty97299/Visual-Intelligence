export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  links?: { title: string; uri: string }[];
}

export interface SmartCardData {
  title: string;
  description: string;
  facts: { label: string; value: string }[];
}

export interface Photo {
  id: string;
  originalUrl: string;
  timestamp: number;
  suggestions?: string[];
  smartCard?: SmartCardData;
  chatHistory: ChatMessage[];
  isLoadingSuggestions?: boolean;
}

export enum ViewState {
  CAMERA = 'CAMERA',
  GALLERY = 'GALLERY',
  DETAIL = 'DETAIL'
}