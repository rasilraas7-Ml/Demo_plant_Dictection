export type SeverityLevel = 'Healthy / Very Low' | 'Mild' | 'Moderate' | 'Severe' | 'Critical';

export type LeafValidationStatus = 
  | 'valid_single_leaf'
  | 'no_leaf'
  | 'multiple_leaves'
  | 'low_quality';

export type ViewOverlayMode = 'original' | 'ai_analysis' | 'damage_mask';

export interface DiseaseInfo {
  id: string;
  plant: string;
  disease: string;
  fullName: string;
  scientificName: string;
  isHealthy: boolean;
  description: string;
  symptoms: string[];
  treatments: string[];
  preventions: string[];
  typicalDamageRange: [number, number]; // min and max typical damage %
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  plant: string;
  disease: string;
  scientificName: string;
  isHealthy: boolean;
  confidence: number; // 0 to 100 percentage
  leafArea: number; // in pixels
  damagedArea: number; // in pixels
  damagePercentage: number; // 0 to 100
  healthyPercentage: number; // 0 to 100
  severity: SeverityLevel;
  severityColor: string;
  leafValidation: {
    status: LeafValidationStatus;
    message: string;
    isValid: boolean;
    confidence: number;
    bbox?: { x: number; y: number; width: number; height: number };
  };
  originalImageUrl: string;
  processedImageUrl: string;
  maskImageUrl: string;
  isDemoMode: boolean;
  recommendations: string[];
  userId?: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  healthyLeaves: number;
  diseasedLeaves: number;
  averageDamagePercentage: number;
  mostDetectedDisease: string;
  severityDistribution: {
    healthy: number; // 0-5%
    mild: number;    // 5-20%
    moderate: number;// 20-40%
    severe: number;  // 40-60%
    critical: number;// 60-100%
  };
}

export interface SampleLeaf {
  id: string;
  name: string;
  plant: string;
  expectedDisease: string;
  description: string;
  thumbnailUrl: string;
  imageDataUrl: string;
}
