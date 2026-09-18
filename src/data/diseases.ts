import { DiseaseInfo, SeverityLevel } from '../types';

export const PLANT_DISEASES: DiseaseInfo[] = [
  {
    id: 'tomato_early_blight',
    plant: 'Tomato',
    disease: 'Early Blight',
    fullName: 'Tomato Early Blight',
    scientificName: 'Alternaria solani',
    isHealthy: false,
    description: 'A destructive fungal disease that causes concentric brown-to-black ring spots with yellow chlorotic halos on foliage.',
    symptoms: [
      'Brown circular spots with characteristic concentric rings (target board pattern)',
      'Yellow chlorotic halos surrounding lesions',
      'Lower leaves affected first, progressing upwards',
      'Defoliation and sunscald vulnerability'
    ],
    treatments: [
      'Apply copper-based fungicide or chlorothalonil immediately at first sign',
      'Prune severely infected bottom leaves and dispose away from compost',
      'Water exclusively at the base using drip irrigation; avoid overhead watering',
      'Apply a 2-3 inch organic mulch layer to prevent soil spore splash'
    ],
    preventions: [
      'Practice 3-year crop rotation away from Solanaceae (tomatoes, potatoes, peppers)',
      'Ensure adequate row spacing for vigorous air circulation',
      'Sterilize pruning shears between plants with 70% isopropyl alcohol'
    ],
    typicalDamageRange: [15, 35]
  },
  {
    id: 'tomato_late_blight',
    plant: 'Tomato',
    disease: 'Late Blight',
    fullName: 'Tomato Late Blight',
    scientificName: 'Phytophthora infestans',
    isHealthy: false,
    description: 'A water mold pathogen that causes large, rapidly spreading water-soaked dark lesions with fuzzy white sporulation.',
    symptoms: [
      'Irregular dark green to brown water-soaked lesions',
      'White fungal-like growth on the leaf underside during humid mornings',
      'Rapidly collapsing and blackening foliage within 48-72 hours',
      'Firm brown greasy lesions on fruit and stems'
    ],
    treatments: [
      'Immediately isolate and remove heavily infected plants into sealed bags',
      'Spray preventative and curatives like mandipropamid or copper hydroxide',
      'Keep foliage strictly dry and increase greenhouse ventilation'
    ],
    preventions: [
      'Plant certified blight-resistant cultivars (e.g., Mountain Magic, Defiant)',
      'Destroy volunteer tomato and potato plants each spring',
      'Monitor regional agricultural blight forecast alerts'
    ],
    typicalDamageRange: [30, 65]
  },
  {
    id: 'tomato_leaf_mold',
    plant: 'Tomato',
    disease: 'Leaf Mold',
    fullName: 'Tomato Leaf Mold',
    scientificName: 'Passalora fulva',
    isHealthy: false,
    description: 'A greenhouse disease characterized by pale green-yellow blotches on leaf surfaces with olive-velvet mold underneath.',
    symptoms: [
      'Pale green to yellowish blotches with diffuse margins on upper leaf',
      'Dense olive-green to brown velvety sporulation on lower leaf surface',
      'Curling and premature death of older leaves'
    ],
    treatments: [
      'Lower relative humidity below 85% by increasing heat and ventilation',
      'Apply approved bio-fungicides such as Bacillus subtilis',
      'Prune lower foliage to promote airflow'
    ],
    preventions: [
      'Select resistant cultivars with Cf resistance genes',
      'Avoid high plant density in polytunnels and greenhouses',
      'Disinfect greenhouse structures between seasons'
    ],
    typicalDamageRange: [10, 28]
  },
  {
    id: 'tomato_healthy',
    plant: 'Tomato',
    disease: 'Healthy',
    fullName: 'Tomato Healthy',
    scientificName: 'Solanum lycopersicum',
    isHealthy: true,
    description: 'Vigorous leaf showing uniform rich green chlorophyll saturation, well-defined veins, and zero necrotic lesions.',
    symptoms: [
      'Uniform deep green leaf coloration',
      'Turgid lamina with intact serrated margins',
      'No spots, yellowing, or fungal sporulation'
    ],
    treatments: [
      'Maintain balanced N-P-K fertilizer schedule with adequate calcium',
      'Continue consistent watering schedule to prevent blossom end rot'
    ],
    preventions: [
      'Routine preventative scouting twice weekly',
      'Proactive companion planting with basil or marigolds'
    ],
    typicalDamageRange: [0, 2]
  },
  {
    id: 'potato_early_blight',
    plant: 'Potato',
    disease: 'Early Blight',
    fullName: 'Potato Early Blight',
    scientificName: 'Alternaria solani',
    isHealthy: false,
    description: 'Produces dark brown angular necrotic spots bounded by leaf veins, creating a ragged and chlorotic foliage canopy.',
    symptoms: [
      'Small dark brown spots that expand into circular or angular lesions',
      'Distinct concentric rings within lesions',
      'Leaf yellowing surrounding infected tissue followed by leaf drop'
    ],
    treatments: [
      'Apply protective contact fungicides (mancozeb, chlorothalonil)',
      'Ensure adequate nitrogen and potassium fertility to maintain vigor'
    ],
    preventions: [
      'Harvest tubers under dry conditions',
      'Avoid overhead sprinkler irrigation during late afternoon'
    ],
    typicalDamageRange: [18, 42]
  },
  {
    id: 'potato_late_blight',
    plant: 'Potato',
    disease: 'Late Blight',
    fullName: 'Potato Late Blight',
    scientificName: 'Phytophthora infestans',
    isHealthy: false,
    description: 'Historically devastating oomycete that causes wet, oily black rot across leaf tissue and rapid vine destruction.',
    symptoms: [
      'Dark brown to purplish-black water-soaked blotches on leaves',
      'Pale green halo around necrotic borders',
      'White downy growth on the underside of leaves under humid conditions'
    ],
    treatments: [
      'Immediate chemical intervention with targeted oomycete fungicides',
      'Desiccate or flail infected foliage prior to harvest to protect tubers'
    ],
    preventions: [
      'Plant only certified disease-free seed tubers',
      'Eliminate cull piles that harbor overwintering inoculum'
    ],
    typicalDamageRange: [35, 75]
  },
  {
    id: 'pepper_bacterial_spot',
    plant: 'Pepper',
    disease: 'Bacterial Spot',
    fullName: 'Pepper Bacterial Spot',
    scientificName: 'Xanthomonas campestris pv. vesicatoria',
    isHealthy: false,
    description: 'Bacterial infection producing small water-soaked spots that become dark brown with yellow halos and scab-like surfaces.',
    symptoms: [
      'Small, circular to irregular water-soaked spots on leaves',
      'Lesions turn dark brown with yellowish halos',
      'Leaves develop blistered appearance and drop prematurely'
    ],
    treatments: [
      'Apply fixed copper bactericides combined with mancozeb',
      'Avoid working among wet plants to prevent bacterial spread'
    ],
    preventions: [
      'Use hot-water treated or certified pathogen-free seeds',
      'Disinfect planting flats and stakes between crops'
    ],
    typicalDamageRange: [12, 38]
  },
  {
    id: 'apple_scab',
    plant: 'Apple',
    disease: 'Apple Scab',
    fullName: 'Apple Scab',
    scientificName: 'Venturia inaequalis',
    isHealthy: false,
    description: 'Fungal disease initiating as olive-green velvety spots on leaves, maturing into dark brown crusty scab lesions.',
    symptoms: [
      'Olive-green to dull brown velvety spots on upper leaf surface',
      'Puckering and distortion of leaf margins',
      'Early season leaf drop leading to defoliation'
    ],
    treatments: [
      'Apply sulfur or myclobutanil fungicides during primary spring spore release',
      'Rake and shred fallen autumn leaves to minimize overwintering pseudothecia'
    ],
    preventions: [
      'Plant scab-immune cultivars (Liberty, Enterprise, GoldRush)',
      'Prune open canopy trees for rapid morning leaf drying'
    ],
    typicalDamageRange: [15, 45]
  }
];

export function calculateSeverity(damagePercentage: number): {
  severity: SeverityLevel;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  gaugeColor: string;
} {
  if (damagePercentage <= 5) {
    return {
      severity: 'Healthy / Very Low',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
      badgeText: 'text-emerald-800 dark:text-emerald-300',
      gaugeColor: '#10b981'
    };
  } else if (damagePercentage <= 20) {
    return {
      severity: 'Mild',
      colorClass: 'text-lime-600 dark:text-lime-400',
      badgeBg: 'bg-lime-100 dark:bg-lime-950/60 border-lime-300 dark:border-lime-800',
      badgeText: 'text-lime-800 dark:text-lime-300',
      gaugeColor: '#84cc16'
    };
  } else if (damagePercentage <= 40) {
    return {
      severity: 'Moderate',
      colorClass: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
      badgeText: 'text-amber-800 dark:text-amber-300',
      gaugeColor: '#f59e0b'
    };
  } else if (damagePercentage <= 60) {
    return {
      severity: 'Severe',
      colorClass: 'text-orange-600 dark:text-orange-400',
      badgeBg: 'bg-orange-100 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800',
      badgeText: 'text-orange-800 dark:text-orange-300',
      gaugeColor: '#f97316'
    };
  } else {
    return {
      severity: 'Critical',
      colorClass: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800',
      badgeText: 'text-rose-800 dark:text-rose-300',
      gaugeColor: '#ef4444'
    };
  }
}
