export type DotType = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
export type CornerSquareType = 'square' | 'dot' | 'extra-rounded';
export type CornerDotType = 'square' | 'dot';

export interface QRConfig {
  value: string;
  ecLevel: 'L' | 'M' | 'Q' | 'H';
  size: number;
  bgColor: string;
  fgColor: string;
  logoUrl: string | null;
  logoSize: number;
  quietZone: number;
  
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerSquareColor: string;
  cornerDotType: CornerDotType;
  cornerDotColor: string;
}

export const DEFAULT_QR_CONFIG: QRConfig = {
  value: 'https://example.com',
  ecLevel: 'M',
  size: 1000, 
  bgColor: '#ffffff',
  fgColor: '#000000',
  logoUrl: null,
  logoSize: 0.4,
  quietZone: 20,
  
  dotType: 'square',
  cornerSquareType: 'square',
  cornerSquareColor: '#000000',
  cornerDotType: 'square',
  cornerDotColor: '#000000',
};

export interface HistoryItem {
  id: string;
  date: number;
  type: string;
  name: string;
  config: QRConfig;
}