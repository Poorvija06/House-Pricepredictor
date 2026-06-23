export interface HouseFeatures {
  area: string;
  intSqft: number;
  nBedroom: number;
  nBathroom: number;
  parkFacil: string;
  buildType: string;
  utilityAvail: string;
  street: string;
  mzzone: string;
  dateBuild: string; // 'DD-MM-YYYY'
  dateSale: string;  // 'DD-MM-YYYY'
}

export interface ModelMetrics {
  r2: number;
  mae: number;
  rmse: number;
  sampleCount: number;
}

export interface PredictionResult {
  predictedPrice: number;
  forecast1Yr: number;
  forecast3Yr: number;
  forecast5Yr: number;
  investmentGrade: 'Poor' | 'Average' | 'Good' | 'Excellent';
  explanation: string;
}

export interface ContactMessage {
  id?: number;
  name: string;
  email: string;
  message: string;
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  messages: {
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
  }[];
}
