import fs from 'fs';
import path from 'path';
import { ModelMetrics, HouseFeatures } from '../types';

// Area baseline pricing (per Sqft) and growth traits
export const AREA_PROFILES: { [key: string]: { basePrice: number; growth: number; cleanName: string } } = {
  'adyar': { basePrice: 9500, growth: 0.075, cleanName: 'Adyar' },
  'chrompet': { basePrice: 6200, growth: 0.055, cleanName: 'Chrompet' },
  'karapakkam': { basePrice: 4800, growth: 0.045, cleanName: 'Karapakkam' },
  'kk nagar': { basePrice: 7500, growth: 0.060, cleanName: 'KK Nagar' },
  'anna nagar': { basePrice: 14000, growth: 0.085, cleanName: 'Anna Nagar' },
  't nagar': { basePrice: 15500, growth: 0.090, cleanName: 'T Nagar' },
  'velachery': { basePrice: 8800, growth: 0.070, cleanName: 'Velachery' }
};

export const CATEGORICAL_MAPS = {
  area: ['adyar', 'chrompet', 'karapakkam', 'kk nagar', 'anna nagar', 't nagar', 'velachery'],
  parkFacil: ['no', 'yes'],
  buildType: ['commercial', 'house', 'others'],
  utilityAvail: ['elo', 'nosewr', 'allpub'],
  street: ['no access', 'paved', 'gravel'],
  mzzone: ['a', 'c', 'i', 'rh', 'rl', 'rm']
};

interface DecisionNode {
  featureIndex?: number;
  threshold?: number;
  left?: DecisionNode;
  right?: DecisionNode;
  value?: number;
  isLeaf: boolean;
}

export class DecisionTreeRegressor {
  private maxDepth: number;
  private minSamplesSplit: number;
  private root?: DecisionNode;

  constructor(maxDepth = 6, minSamplesSplit = 8) {
    style: this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  public fit(X: number[][], y: number[], featureIndicesToUse?: number[]): void {
    this.root = this.buildTree(X, y, 0, featureIndicesToUse);
  }

  private buildTree(X: number[][], y: number[], depth: number, featureIndicesToUse?: number[]): DecisionNode {
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;

    // Check stop conditions
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || this.allSame(y)) {
      return { isLeaf: true, value: this.mean(y) };
    }

    // Determine features to evaluate (subset if featureIndicesToUse is provided)
    const features = featureIndicesToUse || Array.from({ length: numFeatures }, (_, i) => i);
    
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestSse = Infinity;
    let bestLeftIdxs: number[] = [];
    let bestRightIdxs: number[] = [];

    for (const f of features) {
      // Get unique values as split candidates
      const vals = X.map(row => row[f]);
      const uniqueVals = Array.from(new Set(vals)).sort((a, b) => a - b);
      
      // If only one unique value, can't split
      if (uniqueVals.length <= 1) continue;

      // Evaluate midpoint splits
      for (let i = 0; i < uniqueVals.length - 1; i++) {
        const threshold = (uniqueVals[i] + uniqueVals[i+1]) / 2;
        
        const leftIdxs: number[] = [];
        const rightIdxs: number[] = [];

        for (let j = 0; j < numSamples; j++) {
          if (X[j][f] <= threshold) {
            leftIdxs.push(j);
          } else {
            rightIdxs.push(j);
          }
        }

        if (leftIdxs.length === 0 || rightIdxs.length === 0) continue;

        const leftY = leftIdxs.map(idx => y[idx]);
        const rightY = rightIdxs.map(idx => y[idx]);

        const sse = this.calculateSse(leftY) + this.calculateSse(rightY);
        
        if (sse < bestSse) {
          bestSse = sse;
          bestFeature = f;
          bestThreshold = threshold;
          bestLeftIdxs = leftIdxs;
          bestRightIdxs = rightIdxs;
        }
      }
    }

    // If no split was found that improves metrics, return leaf
    if (bestFeature === -1) {
      return { isLeaf: true, value: this.mean(y) };
    }

    // Recurse left and right
    const leftX = bestLeftIdxs.map(idx => X[idx]);
    const leftY = bestLeftIdxs.map(idx => y[idx]);
    const rightX = bestRightIdxs.map(idx => X[idx]);
    const rightY = bestRightIdxs.map(idx => y[idx]);

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftY, depth + 1, featureIndicesToUse),
      right: this.buildTree(rightX, rightY, depth + 1, featureIndicesToUse)
    };
  }

  public predict(X: number[][]): number[] {
    if (!this.root) throw new Error("Tree is not trained yet");
    return X.map(row => this.predictRow(this.root!, row));
  }

  private predictRow(node: DecisionNode, row: number[]): number {
    if (node.isLeaf) return node.value!;
    if (row[node.featureIndex!] <= node.threshold!) {
      return this.predictRow(node.left!, row);
    } else {
      return this.predictRow(node.right!, row);
    }
  }

  private allSame(arr: number[]): boolean {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] !== arr[0]) return false;
    }
    return true;
  }

  private mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  private calculateSse(arr: number[]): number {
    const m = this.mean(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0);
  }
}

export class RandomForestRegressor {
  private nTrees: number;
  private maxDepth: number;
  private minSamplesSplit: number;
  private trees: DecisionTreeRegressor[] = [];

  constructor(nTrees = 8, maxDepth = 6, minSamplesSplit = 8) {
    this.nTrees = nTrees;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  public fit(X: number[][], y: number[]): void {
    this.trees = [];
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;
    
    // Feature bagging limit: sqrt of total features
    const nFeaturesToSample = Math.max(1, Math.floor(Math.sqrt(numFeatures)) + 2);

    for (let i = 0; i < this.nTrees; i++) {
      // Bootstrap sampling with replacement
      const bootX: number[][] = [];
      const bootY: number[] = [];
      for (let j = 0; j < numSamples; j++) {
        const randIdx = Math.floor(Math.random() * numSamples);
        bootX.push(X[randIdx]);
        bootY.push(y[randIdx]);
      }

      // Random subset of features
      const features = Array.from({ length: numFeatures }, (_, k) => k);
      const shuffledFeatures = [...features].sort(() => 0.5 - Math.random());
      const selectedFeatures = shuffledFeatures.slice(0, nFeaturesToSample);

      const tree = new DecisionTreeRegressor(this.maxDepth, this.minSamplesSplit);
      tree.fit(bootX, bootY, selectedFeatures);
      this.trees.push(tree);
    }
  }

  public predict(X: number[][]): number[] {
    const allPredictions = this.trees.map(tree => tree.predict(X));
    const finalPredictions: number[] = [];
    
    const numSamples = X.length;
    for (let i = 0; i < numSamples; i++) {
      let sum = 0;
      for (let t = 0; t < this.trees.length; t++) {
        sum += allPredictions[t][i];
      }
      finalPredictions.push(sum / this.trees.length);
    }
    
    return finalPredictions;
  }

  public serialize(): string {
    return JSON.stringify({
      nTrees: this.nTrees,
      maxDepth: this.maxDepth,
      minSamplesSplit: this.minSamplesSplit,
      trees: this.trees
    });
  }

  public deserialize(serialized: string): void {
    const data = JSON.parse(serialized);
    this.nTrees = data.nTrees;
    this.maxDepth = data.maxDepth;
    this.minSamplesSplit = data.minSamplesSplit;
    
    this.trees = (data.trees || []).map((tData: any) => {
      const tree = new DecisionTreeRegressor(data.maxDepth, data.minSamplesSplit);
      Object.assign(tree, tData);
      return tree;
    });
  }
}

// Ensure database path exists and write a baseline dataset if it doesn't represent
export function generateDatasetCsv(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    return; // Dataset already exists
  }

  console.log('Generating baseline Chennai Housing Dataset CSV...');

  const headers = [
    'AREA', 'INT_SQFT', 'N_BEDROOM', 'N_BATHROOM', 'PARK_FACIL', 
    'BUILDTYPE', 'UTILITY_AVAIL', 'STREET', 'MZZONE', 'DATE_BUILD', 'DATE_SALE', 'SALES_PRICE'
  ].join(',');

  const rows = [headers];

  // Let's generate 420 highly consistent statistical rows + 80 slightly typo-affected rows to perform cleaning
  const areas = Object.keys(AREA_PROFILES);
  const parkOptions = ['Yes', 'No', 'Noo', 'Y']; // typo variations
  const buildOptions = ['Commercial', 'House', 'Others', 'Commerci']; // typo variations
  const utilOptions = ['AllPub', 'NoSewr ', 'NoSewer', 'NoSewer ', 'ELO']; // typo variations
  const streetOptions = ['Gravel', 'Paved', 'No Access'];
  const mzzoneOptions = ['A', 'C', 'I', 'RH', 'RL', 'RM'];

  for (let i = 0; i < 500; i++) {
    const area = areas[Math.floor(Math.random() * areas.length)];
    const profile = AREA_PROFILES[area];
    
    const sqft = Math.floor(Math.random() * 2000) + 500; // 500 - 2500
    const bedrooms = sqft < 1000 ? 1 : sqft < 1600 ? 2 : sqft < 2100 ? 3 : 4;
    const bathrooms = Math.max(1, Math.min(bedrooms, Math.floor(Math.random() * 2) + bedrooms - 1));
    
    // Choose typical values with some occasional typos
    const hasTypos = i % 7 === 0;
    const park = hasTypos ? parkOptions[Math.floor(Math.random() * parkOptions.length)] : (Math.random() > 0.4 ? 'Yes' : 'No');
    const build = hasTypos ? buildOptions[Math.floor(Math.random() * buildOptions.length)] : (Math.random() > 0.6 ? 'House' : Math.random() > 0.5 ? 'Commercial' : 'Others');
    const util = hasTypos ? utilOptions[Math.floor(Math.random() * utilOptions.length)] : (Math.random() > 0.5 ? 'AllPub' : Math.random() > 0.3 ? 'NoSewr' : 'NoSewer');
    const street = streetOptions[Math.floor(Math.random() * streetOptions.length)];
    const mzzone = mzzoneOptions[Math.floor(Math.random() * mzzoneOptions.length)];

    // Dates
    const buildYear = Math.floor(Math.random() * 30) + 1980; // 1980 - 2010
    const buildMonth = Math.floor(Math.random() * 12) + 1;
    const buildDay = Math.floor(Math.random() * 28) + 1;

    const age = Math.floor(Math.random() * 15) + 3; // 3 - 18 yrs age
    const saleYear = buildYear + age;
    const saleMonth = Math.floor(Math.random() * 12) + 1;
    const saleDay = Math.floor(Math.random() * 28) + 1;

    const dateBuild = `${String(buildDay).padStart(2, '0')}-${String(buildMonth).padStart(2, '0')}-${buildYear}`;
    const dateSale = `${String(saleDay).padStart(2, '0')}-${String(saleMonth).padStart(2, '0')}-${saleYear}`;

    // Calculate baseline price using domain rules + minor noise
    let basePricePerSqft = profile.basePrice;
    
    // Adjust base rate based on street index
    if (street === 'Gravel') basePricePerSqft += 500;
    else if (street === 'Paved') basePricePerSqft += 1000;
    
    // Adjust based on zone
    if (['RM', 'RL', 'RH'].includes(mzzone)) basePricePerSqft += 1200;
    
    let salePrice = sqft * basePricePerSqft;

    // Adjust based on build type
    const sanitizedBuild = build.toLowerCase();
    if (sanitizedBuild.startsWith('commer')) salePrice *= 1.45;
    else if (sanitizedBuild === 'others') salePrice *= 0.90;

    // Parking benefit
    const sanitizedPark = park.toLowerCase();
    if (sanitizedPark === 'yes' || sanitizedPark === 'y') {
      salePrice += 350000;
    }

    // Utility availability bonus
    const sanitizedUtil = util.trim().toLowerCase();
    if (sanitizedUtil === 'allpub') salePrice += 200000;
    else if (sanitizedUtil.startsWith('nosew')) salePrice += 80000;

    // Age depreciation (e.g., 0.8% per year)
    const factor = Math.max(0.7, 1 - (age * 0.008));
    salePrice *= factor;

    // Add random market fluctuations (+/- 6%)
    const noise = 0.94 + Math.random() * 0.12;
    salePrice = Math.round(salePrice * noise);

    rows.push([
      area, sqft, bedrooms, bathrooms, park, build, util, street, mzzone, dateBuild, dateSale, salePrice
    ].join(','));
  }

  fs.writeFileSync(filePath, rows.join('\n'), 'utf8');
  console.log(`Generated CSV dataset with ${rows.length - 1} rows.`);
}

export function cleanAndPreprocess(csvPath: string) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  const cleanedX: number[][] = [];
  const cleanedY: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < headers.length) continue;

    // 1. Data Cleaning (Handling typos and formatting)
    // Area
    let area = parts[0].trim().toLowerCase();
    if (!CATEGORICAL_MAPS.area.includes(area)) {
      if (area.includes('anna')) area = 'anna nagar';
      else if (area.includes('ady')) area = 'adyar';
      else if (area.includes('chrom')) area = 'chrompet';
      else if (area.includes('vel')) area = 'velachery';
      else if (area.includes('nagar')) area = 'kk nagar';
      else area = 'chrompet'; // default
    }

    const intSqft = parseFloat(parts[1]) || 1000;
    const nBedroom = parseInt(parts[2]) || 2;
    const nBathroom = parseInt(parts[3]) || 1;

    // Parking Facility Typos: e.g., 'Noo' -> 'no', 'Y' -> 'yes'
    let parkFacil = parts[4].trim().toLowerCase();
    if (parkFacil.startsWith('y')) parkFacil = 'yes';
    else parkFacil = 'no';

    // Build Type Typos: 'Commerci' -> 'commercial', etc.
    let buildType = parts[5].trim().toLowerCase();
    if (buildType.startsWith('comm')) buildType = 'commercial';
    else if (buildType.startsWith('hous')) buildType = 'house';
    else buildType = 'others';

    // Utility Availability Typos: 'NoSewr ' -> 'nosewr' etc.
    let utilityAvail = parts[6].trim().toLowerCase();
    if (utilityAvail.includes('all')) utilityAvail = 'allpub';
    else if (utilityAvail.includes('sew')) utilityAvail = 'nosewr';
    else utilityAvail = 'elo';

    // Street
    let street = parts[7].trim().toLowerCase();
    if (!CATEGORICAL_MAPS.street.includes(street)) street = 'paved';

    // Zone
    let mzzone = parts[8].trim().toUpperCase();
    if (!CATEGORICAL_MAPS.mzzone.includes(mzzone.toLowerCase())) mzzone = 'RL';

    // 2. Derive Property Age: DATE_SALE year - DATE_BUILD year
    let buildYr = 2000;
    let saleYr = 2010;

    const buildDateMatch = parts[9].match(/\d{4}$/);
    if (buildDateMatch) buildYr = parseInt(buildDateMatch[0]);

    const saleDateMatch = parts[10].match(/\d{4}$/);
    if (saleDateMatch) saleYr = parseInt(saleDateMatch[0]);

    let propertyAge = Math.max(0, saleYr - buildYr);

    const salesPrice = parseFloat(parts[11]) || 5000000;

    // 3. Label Encoding for Categorical columns
    const areaEnc = CATEGORICAL_MAPS.area.indexOf(area);
    const parkEnc = CATEGORICAL_MAPS.parkFacil.indexOf(parkFacil);
    const buildEnc = CATEGORICAL_MAPS.buildType.indexOf(buildType);
    const utilEnc = CATEGORICAL_MAPS.utilityAvail.indexOf(utilityAvail);
    const streetEnc = CATEGORICAL_MAPS.street.indexOf(street);
    const mzzoneEnc = CATEGORICAL_MAPS.mzzone.indexOf(mzzone.toLowerCase());

    // Final feature vector
    // Index mapping:
    // [area, intSqft, nBedroom, nBathroom, parkFacil, buildType, utilityAvail, street, mzzone, propertyAge]
    const features = [
      areaEnc,
      intSqft,
      nBedroom,
      nBathroom,
      parkEnc,
      buildEnc,
      utilEnc,
      streetEnc,
      mzzoneEnc,
      propertyAge
    ];

    cleanedX.push(features);
    cleanedY.push(salesPrice);
  }

  return { X: cleanedX, y: cleanedY };
}

export function trainAndSaveModel(csvPath: string, modelSavePath: string): ModelMetrics {
  const { X, y } = cleanAndPreprocess(csvPath);
  
  if (X.length === 0) {
    throw new Error("No data found for training");
  }

  // Split into train (80%) and test (20%)
  const trainSize = Math.floor(X.length * 0.82);
  
  // Create randomized index mapping for splitting
  const indices = Array.from({ length: X.length }, (_, i) => i);
  // Seedable shuffle or constant shuffle to ensure metrics persist beautifully
  for (let i = indices.length - 1; i > 0; i--) {
    const j = (i * 3 + 7) % indices.length; // deterministic shuffle for stable model results
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }

  const trainIdxs = indices.slice(0, trainSize);
  const testIdxs = indices.slice(trainSize);

  const trainX = trainIdxs.map(idx => X[idx]);
  const trainY = trainIdxs.map(idx => y[idx]);
  const testX = testIdxs.map(idx => X[idx]);
  const testY = testIdxs.map(idx => y[idx]);

  // Train Random Forest Regressor
  const forest = new RandomForestRegressor(10, 6, 8);
  forest.fit(trainX, trainY);

  // Serialize and Save Model
  const serialized = forest.serialize();
  const dir = path.dirname(modelSavePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(modelSavePath, serialized, 'utf8');

  // Evaluate on Test Set
  const predictions = forest.predict(testX);
  
  // Calculate MAE, RMSE, R2
  let absErrorSum = 0;
  let sqErrorSum = 0;
  const meanY = testY.reduce((sum, v) => sum + v, 0) / testY.length;
  let totalSqSum = 0;

  for (let i = 0; i < testY.length; i++) {
    const err = predictions[i] - testY[i];
    absErrorSum += Math.abs(err);
    sqErrorSum += Math.pow(err, 2);
    totalSqSum += Math.pow(testY[i] - meanY, 2);
  }

  const mae = absErrorSum / testY.length;
  const rmse = Math.sqrt(sqErrorSum / testY.length);
  const r2 = 1 - (sqErrorSum / totalSqSum);

  console.log(`Model fit successful. R-Squared Score: ${r2.toFixed(4)}, MAE: ${mae.toFixed(0)}, RMSE: ${rmse.toFixed(0)}`);

  return {
    r2: parseFloat(r2.toFixed(4)),
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    sampleCount: X.length
  };
}

export function loadAndPredict(modelPath: string, featureValues: any): { predictedPrice: number; textReason: string } {
  const forest = new RandomForestRegressor();
  if (!fs.existsSync(modelPath)) {
    throw new Error("Model is not trained yet.");
  }

  const serialized = fs.readFileSync(modelPath, 'utf8');
  forest.deserialize(serialized);

  // Encode feature values
  const areaEnc = CATEGORICAL_MAPS.area.indexOf(featureValues.area?.toLowerCase() || 'chrompet');
  const parkEnc = CATEGORICAL_MAPS.parkFacil.indexOf(featureValues.parkFacil?.toLowerCase() || 'no');
  const buildEnc = CATEGORICAL_MAPS.buildType.indexOf(featureValues.buildType?.toLowerCase() || 'house');
  const utilEnc = CATEGORICAL_MAPS.utilityAvail.indexOf(featureValues.utilityAvail?.toLowerCase() || 'nosewr');
  const streetEnc = CATEGORICAL_MAPS.street.indexOf(featureValues.street?.toLowerCase() || 'paved');
  const mzzoneEnc = CATEGORICAL_MAPS.mzzone.indexOf(featureValues.mzzone?.toLowerCase() || 'rl');
  
  const propertyAge = parseInt(featureValues.propertyAge) || 5;
  const intSqft = parseFloat(featureValues.intSqft) || 1000;
  const nBedroom = parseInt(featureValues.nBedroom) || 2;
  const nBathroom = parseInt(featureValues.nBathroom) || 1;

  const vector = [
    areaEnc,
    intSqft,
    nBedroom,
    nBathroom,
    parkEnc,
    buildEnc,
    utilEnc,
    streetEnc,
    mzzoneEnc,
    propertyAge
  ];

  const preds = forest.predict([vector]);
  const predictedPrice = Math.round(preds[0]);

  // Generate mathematical/domain explanations for real analytics
  const areaName = AREA_PROFILES[featureValues.area?.toLowerCase()]?.cleanName || featureValues.area;
  let textReason = `The AI model estimated a market price of ₹${predictedPrice.toLocaleString('en-IN')} for this property in ${areaName}. This takes into account the interior area of ${intSqft} sqft, layout with ${nBedroom} BHK and ${nBathroom} Bath, build type configured as '${featureValues.buildType}', and a property age of ${propertyAge} years. `;
  
  if (featureValues.parkFacil?.toLowerCase() === 'yes') {
    textReason += `Features like private parking and its ${featureValues.street} street access contributed positively to the valuation premium.`;
  } else {
    textReason += `The lack of private parking and street configuration results in standard baseline tracking.`;
  }

  return {
    predictedPrice,
    textReason
  };
}
