var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);

// src/lib/ml.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var AREA_PROFILES = {
  "adyar": { basePrice: 9500, growth: 0.075, cleanName: "Adyar" },
  "chrompet": { basePrice: 6200, growth: 0.055, cleanName: "Chrompet" },
  "karapakkam": { basePrice: 4800, growth: 0.045, cleanName: "Karapakkam" },
  "kk nagar": { basePrice: 7500, growth: 0.06, cleanName: "KK Nagar" },
  "anna nagar": { basePrice: 14e3, growth: 0.085, cleanName: "Anna Nagar" },
  "t nagar": { basePrice: 15500, growth: 0.09, cleanName: "T Nagar" },
  "velachery": { basePrice: 8800, growth: 0.07, cleanName: "Velachery" }
};
var CATEGORICAL_MAPS = {
  area: ["adyar", "chrompet", "karapakkam", "kk nagar", "anna nagar", "t nagar", "velachery"],
  parkFacil: ["no", "yes"],
  buildType: ["commercial", "house", "others"],
  utilityAvail: ["elo", "nosewr", "allpub"],
  street: ["no access", "paved", "gravel"],
  mzzone: ["a", "c", "i", "rh", "rl", "rm"]
};
var DecisionTreeRegressor = class {
  constructor(maxDepth = 6, minSamplesSplit = 8) {
    style: this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }
  fit(X, y, featureIndicesToUse) {
    this.root = this.buildTree(X, y, 0, featureIndicesToUse);
  }
  buildTree(X, y, depth, featureIndicesToUse) {
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || this.allSame(y)) {
      return { isLeaf: true, value: this.mean(y) };
    }
    const features = featureIndicesToUse || Array.from({ length: numFeatures }, (_, i) => i);
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestSse = Infinity;
    let bestLeftIdxs = [];
    let bestRightIdxs = [];
    for (const f of features) {
      const vals = X.map((row) => row[f]);
      const uniqueVals = Array.from(new Set(vals)).sort((a, b) => a - b);
      if (uniqueVals.length <= 1) continue;
      for (let i = 0; i < uniqueVals.length - 1; i++) {
        const threshold = (uniqueVals[i] + uniqueVals[i + 1]) / 2;
        const leftIdxs = [];
        const rightIdxs = [];
        for (let j = 0; j < numSamples; j++) {
          if (X[j][f] <= threshold) {
            leftIdxs.push(j);
          } else {
            rightIdxs.push(j);
          }
        }
        if (leftIdxs.length === 0 || rightIdxs.length === 0) continue;
        const leftY2 = leftIdxs.map((idx) => y[idx]);
        const rightY2 = rightIdxs.map((idx) => y[idx]);
        const sse = this.calculateSse(leftY2) + this.calculateSse(rightY2);
        if (sse < bestSse) {
          bestSse = sse;
          bestFeature = f;
          bestThreshold = threshold;
          bestLeftIdxs = leftIdxs;
          bestRightIdxs = rightIdxs;
        }
      }
    }
    if (bestFeature === -1) {
      return { isLeaf: true, value: this.mean(y) };
    }
    const leftX = bestLeftIdxs.map((idx) => X[idx]);
    const leftY = bestLeftIdxs.map((idx) => y[idx]);
    const rightX = bestRightIdxs.map((idx) => X[idx]);
    const rightY = bestRightIdxs.map((idx) => y[idx]);
    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftY, depth + 1, featureIndicesToUse),
      right: this.buildTree(rightX, rightY, depth + 1, featureIndicesToUse)
    };
  }
  predict(X) {
    if (!this.root) throw new Error("Tree is not trained yet");
    return X.map((row) => this.predictRow(this.root, row));
  }
  predictRow(node, row) {
    if (node.isLeaf) return node.value;
    if (row[node.featureIndex] <= node.threshold) {
      return this.predictRow(node.left, row);
    } else {
      return this.predictRow(node.right, row);
    }
  }
  allSame(arr) {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] !== arr[0]) return false;
    }
    return true;
  }
  mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
  calculateSse(arr) {
    const m = this.mean(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0);
  }
};
var RandomForestRegressor = class {
  constructor(nTrees = 8, maxDepth = 6, minSamplesSplit = 8) {
    this.trees = [];
    this.nTrees = nTrees;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }
  fit(X, y) {
    this.trees = [];
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;
    const nFeaturesToSample = Math.max(1, Math.floor(Math.sqrt(numFeatures)) + 2);
    for (let i = 0; i < this.nTrees; i++) {
      const bootX = [];
      const bootY = [];
      for (let j = 0; j < numSamples; j++) {
        const randIdx = Math.floor(Math.random() * numSamples);
        bootX.push(X[randIdx]);
        bootY.push(y[randIdx]);
      }
      const features = Array.from({ length: numFeatures }, (_, k) => k);
      const shuffledFeatures = [...features].sort(() => 0.5 - Math.random());
      const selectedFeatures = shuffledFeatures.slice(0, nFeaturesToSample);
      const tree = new DecisionTreeRegressor(this.maxDepth, this.minSamplesSplit);
      tree.fit(bootX, bootY, selectedFeatures);
      this.trees.push(tree);
    }
  }
  predict(X) {
    const allPredictions = this.trees.map((tree) => tree.predict(X));
    const finalPredictions = [];
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
  serialize() {
    return JSON.stringify({
      nTrees: this.nTrees,
      maxDepth: this.maxDepth,
      minSamplesSplit: this.minSamplesSplit,
      trees: this.trees
    });
  }
  deserialize(serialized) {
    const data = JSON.parse(serialized);
    this.nTrees = data.nTrees;
    this.maxDepth = data.maxDepth;
    this.minSamplesSplit = data.minSamplesSplit;
    this.trees = (data.trees || []).map((tData) => {
      const tree = new DecisionTreeRegressor(data.maxDepth, data.minSamplesSplit);
      Object.assign(tree, tData);
      return tree;
    });
  }
};
function generateDatasetCsv(filePath) {
  const dir = import_path.default.dirname(filePath);
  if (!import_fs.default.existsSync(dir)) {
    import_fs.default.mkdirSync(dir, { recursive: true });
  }
  if (import_fs.default.existsSync(filePath)) {
    return;
  }
  console.log("Generating baseline Chennai Housing Dataset CSV...");
  const headers = [
    "AREA",
    "INT_SQFT",
    "N_BEDROOM",
    "N_BATHROOM",
    "PARK_FACIL",
    "BUILDTYPE",
    "UTILITY_AVAIL",
    "STREET",
    "MZZONE",
    "DATE_BUILD",
    "DATE_SALE",
    "SALES_PRICE"
  ].join(",");
  const rows = [headers];
  const areas = Object.keys(AREA_PROFILES);
  const parkOptions = ["Yes", "No", "Noo", "Y"];
  const buildOptions = ["Commercial", "House", "Others", "Commerci"];
  const utilOptions = ["AllPub", "NoSewr ", "NoSewer", "NoSewer ", "ELO"];
  const streetOptions = ["Gravel", "Paved", "No Access"];
  const mzzoneOptions = ["A", "C", "I", "RH", "RL", "RM"];
  for (let i = 0; i < 500; i++) {
    const area = areas[Math.floor(Math.random() * areas.length)];
    const profile = AREA_PROFILES[area];
    const sqft = Math.floor(Math.random() * 2e3) + 500;
    const bedrooms = sqft < 1e3 ? 1 : sqft < 1600 ? 2 : sqft < 2100 ? 3 : 4;
    const bathrooms = Math.max(1, Math.min(bedrooms, Math.floor(Math.random() * 2) + bedrooms - 1));
    const hasTypos = i % 7 === 0;
    const park = hasTypos ? parkOptions[Math.floor(Math.random() * parkOptions.length)] : Math.random() > 0.4 ? "Yes" : "No";
    const build = hasTypos ? buildOptions[Math.floor(Math.random() * buildOptions.length)] : Math.random() > 0.6 ? "House" : Math.random() > 0.5 ? "Commercial" : "Others";
    const util = hasTypos ? utilOptions[Math.floor(Math.random() * utilOptions.length)] : Math.random() > 0.5 ? "AllPub" : Math.random() > 0.3 ? "NoSewr" : "NoSewer";
    const street = streetOptions[Math.floor(Math.random() * streetOptions.length)];
    const mzzone = mzzoneOptions[Math.floor(Math.random() * mzzoneOptions.length)];
    const buildYear = Math.floor(Math.random() * 30) + 1980;
    const buildMonth = Math.floor(Math.random() * 12) + 1;
    const buildDay = Math.floor(Math.random() * 28) + 1;
    const age = Math.floor(Math.random() * 15) + 3;
    const saleYear = buildYear + age;
    const saleMonth = Math.floor(Math.random() * 12) + 1;
    const saleDay = Math.floor(Math.random() * 28) + 1;
    const dateBuild = `${String(buildDay).padStart(2, "0")}-${String(buildMonth).padStart(2, "0")}-${buildYear}`;
    const dateSale = `${String(saleDay).padStart(2, "0")}-${String(saleMonth).padStart(2, "0")}-${saleYear}`;
    let basePricePerSqft = profile.basePrice;
    if (street === "Gravel") basePricePerSqft += 500;
    else if (street === "Paved") basePricePerSqft += 1e3;
    if (["RM", "RL", "RH"].includes(mzzone)) basePricePerSqft += 1200;
    let salePrice = sqft * basePricePerSqft;
    const sanitizedBuild = build.toLowerCase();
    if (sanitizedBuild.startsWith("commer")) salePrice *= 1.45;
    else if (sanitizedBuild === "others") salePrice *= 0.9;
    const sanitizedPark = park.toLowerCase();
    if (sanitizedPark === "yes" || sanitizedPark === "y") {
      salePrice += 35e4;
    }
    const sanitizedUtil = util.trim().toLowerCase();
    if (sanitizedUtil === "allpub") salePrice += 2e5;
    else if (sanitizedUtil.startsWith("nosew")) salePrice += 8e4;
    const factor = Math.max(0.7, 1 - age * 8e-3);
    salePrice *= factor;
    const noise = 0.94 + Math.random() * 0.12;
    salePrice = Math.round(salePrice * noise);
    rows.push([
      area,
      sqft,
      bedrooms,
      bathrooms,
      park,
      build,
      util,
      street,
      mzzone,
      dateBuild,
      dateSale,
      salePrice
    ].join(","));
  }
  import_fs.default.writeFileSync(filePath, rows.join("\n"), "utf8");
  console.log(`Generated CSV dataset with ${rows.length - 1} rows.`);
}
function cleanAndPreprocess(csvPath) {
  const content = import_fs.default.readFileSync(csvPath, "utf8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  const cleanedX = [];
  const cleanedY = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < headers.length) continue;
    let area = parts[0].trim().toLowerCase();
    if (!CATEGORICAL_MAPS.area.includes(area)) {
      if (area.includes("anna")) area = "anna nagar";
      else if (area.includes("ady")) area = "adyar";
      else if (area.includes("chrom")) area = "chrompet";
      else if (area.includes("vel")) area = "velachery";
      else if (area.includes("nagar")) area = "kk nagar";
      else area = "chrompet";
    }
    const intSqft = parseFloat(parts[1]) || 1e3;
    const nBedroom = parseInt(parts[2]) || 2;
    const nBathroom = parseInt(parts[3]) || 1;
    let parkFacil = parts[4].trim().toLowerCase();
    if (parkFacil.startsWith("y")) parkFacil = "yes";
    else parkFacil = "no";
    let buildType = parts[5].trim().toLowerCase();
    if (buildType.startsWith("comm")) buildType = "commercial";
    else if (buildType.startsWith("hous")) buildType = "house";
    else buildType = "others";
    let utilityAvail = parts[6].trim().toLowerCase();
    if (utilityAvail.includes("all")) utilityAvail = "allpub";
    else if (utilityAvail.includes("sew")) utilityAvail = "nosewr";
    else utilityAvail = "elo";
    let street = parts[7].trim().toLowerCase();
    if (!CATEGORICAL_MAPS.street.includes(street)) street = "paved";
    let mzzone = parts[8].trim().toUpperCase();
    if (!CATEGORICAL_MAPS.mzzone.includes(mzzone.toLowerCase())) mzzone = "RL";
    let buildYr = 2e3;
    let saleYr = 2010;
    const buildDateMatch = parts[9].match(/\d{4}$/);
    if (buildDateMatch) buildYr = parseInt(buildDateMatch[0]);
    const saleDateMatch = parts[10].match(/\d{4}$/);
    if (saleDateMatch) saleYr = parseInt(saleDateMatch[0]);
    let propertyAge = Math.max(0, saleYr - buildYr);
    const salesPrice = parseFloat(parts[11]) || 5e6;
    const areaEnc = CATEGORICAL_MAPS.area.indexOf(area);
    const parkEnc = CATEGORICAL_MAPS.parkFacil.indexOf(parkFacil);
    const buildEnc = CATEGORICAL_MAPS.buildType.indexOf(buildType);
    const utilEnc = CATEGORICAL_MAPS.utilityAvail.indexOf(utilityAvail);
    const streetEnc = CATEGORICAL_MAPS.street.indexOf(street);
    const mzzoneEnc = CATEGORICAL_MAPS.mzzone.indexOf(mzzone.toLowerCase());
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
function trainAndSaveModel(csvPath, modelSavePath) {
  const { X, y } = cleanAndPreprocess(csvPath);
  if (X.length === 0) {
    throw new Error("No data found for training");
  }
  const trainSize = Math.floor(X.length * 0.82);
  const indices = Array.from({ length: X.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = (i * 3 + 7) % indices.length;
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }
  const trainIdxs = indices.slice(0, trainSize);
  const testIdxs = indices.slice(trainSize);
  const trainX = trainIdxs.map((idx) => X[idx]);
  const trainY = trainIdxs.map((idx) => y[idx]);
  const testX = testIdxs.map((idx) => X[idx]);
  const testY = testIdxs.map((idx) => y[idx]);
  const forest = new RandomForestRegressor(10, 6, 8);
  forest.fit(trainX, trainY);
  const serialized = forest.serialize();
  const dir = import_path.default.dirname(modelSavePath);
  if (!import_fs.default.existsSync(dir)) {
    import_fs.default.mkdirSync(dir, { recursive: true });
  }
  import_fs.default.writeFileSync(modelSavePath, serialized, "utf8");
  const predictions = forest.predict(testX);
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
  const r2 = 1 - sqErrorSum / totalSqSum;
  console.log(`Model fit successful. R-Squared Score: ${r2.toFixed(4)}, MAE: ${mae.toFixed(0)}, RMSE: ${rmse.toFixed(0)}`);
  return {
    r2: parseFloat(r2.toFixed(4)),
    mae: Math.round(mae),
    rmse: Math.round(rmse),
    sampleCount: X.length
  };
}
function loadAndPredict(modelPath, featureValues) {
  const forest = new RandomForestRegressor();
  if (!import_fs.default.existsSync(modelPath)) {
    throw new Error("Model is not trained yet.");
  }
  const serialized = import_fs.default.readFileSync(modelPath, "utf8");
  forest.deserialize(serialized);
  const areaEnc = CATEGORICAL_MAPS.area.indexOf(featureValues.area?.toLowerCase() || "chrompet");
  const parkEnc = CATEGORICAL_MAPS.parkFacil.indexOf(featureValues.parkFacil?.toLowerCase() || "no");
  const buildEnc = CATEGORICAL_MAPS.buildType.indexOf(featureValues.buildType?.toLowerCase() || "house");
  const utilEnc = CATEGORICAL_MAPS.utilityAvail.indexOf(featureValues.utilityAvail?.toLowerCase() || "nosewr");
  const streetEnc = CATEGORICAL_MAPS.street.indexOf(featureValues.street?.toLowerCase() || "paved");
  const mzzoneEnc = CATEGORICAL_MAPS.mzzone.indexOf(featureValues.mzzone?.toLowerCase() || "rl");
  const propertyAge = parseInt(featureValues.propertyAge) || 5;
  const intSqft = parseFloat(featureValues.intSqft) || 1e3;
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
  const areaName = AREA_PROFILES[featureValues.area?.toLowerCase()]?.cleanName || featureValues.area;
  let textReason = `The AI model estimated a market price of \u20B9${predictedPrice.toLocaleString("en-IN")} for this property in ${areaName}. This takes into account the interior area of ${intSqft} sqft, layout with ${nBedroom} BHK and ${nBathroom} Bath, build type configured as '${featureValues.buildType}', and a property age of ${propertyAge} years. `;
  if (featureValues.parkFacil?.toLowerCase() === "yes") {
    textReason += `Features like private parking and its ${featureValues.street} street access contributed positively to the valuation premium.`;
  } else {
    textReason += `The lack of private parking and street configuration results in standard baseline tracking.`;
  }
  return {
    predictedPrice,
    textReason
  };
}

// src/db/index.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var DB_DIR = import_path2.default.resolve(process.cwd(), "data");
var DB_FILE = import_path2.default.join(DB_DIR, "contacts.sqlite");
var BACKUP_JSON_FILE = import_path2.default.join(DB_DIR, "contacts_backup.json");
var sqliteDb = null;
var isUsingSqlite = false;
async function initDb() {
  if (!import_fs2.default.existsSync(DB_DIR)) {
    import_fs2.default.mkdirSync(DB_DIR, { recursive: true });
  }
  try {
    const sqlite3Module = await import("sqlite3");
    const sqlite3 = sqlite3Module.default.verbose();
    return new Promise((resolve, reject) => {
      sqliteDb = new sqlite3.Database(DB_FILE, (err) => {
        if (err) {
          console.error("Failed to open SQLite database, falling back to JSON storage:", err.message);
          isUsingSqlite = false;
          resolve();
        } else {
          sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS contacts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `, (tableErr) => {
            if (tableErr) {
              console.error("Failed to create table in SQLite, falling back:", tableErr.message);
              isUsingSqlite = false;
            } else {
              console.log("SQLite database initialized successfully at:", DB_FILE);
              isUsingSqlite = true;
            }
            resolve();
          });
        }
      });
    });
  } catch (err) {
    console.warn("sqlite3 package not available or failed to load. Using robust JSON local persistence fallback.");
    isUsingSqlite = false;
    if (!import_fs2.default.existsSync(BACKUP_JSON_FILE)) {
      import_fs2.default.writeFileSync(BACKUP_JSON_FILE, JSON.stringify([]), "utf8");
    }
  }
}
async function saveContactMessage(name, email, message) {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanMsg = message.trim();
  if (isUsingSqlite && sqliteDb) {
    return new Promise((resolve, reject) => {
      const stmt = sqliteDb.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)");
      stmt.run(cleanName, cleanEmail, cleanMsg, function(err) {
        if (err) {
          console.error("Error saving to SQLite, falling back to JSON save:", err.message);
          saveToBackupJson(cleanName, cleanEmail, cleanMsg).then(resolve).catch(reject);
        } else {
          resolve({
            id: this.lastID,
            name: cleanName,
            email: cleanEmail,
            message: cleanMsg,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      });
      stmt.finalize();
    });
  } else {
    return saveToBackupJson(cleanName, cleanEmail, cleanMsg);
  }
}
async function saveToBackupJson(name, email, message) {
  try {
    let items = [];
    if (import_fs2.default.existsSync(BACKUP_JSON_FILE)) {
      const content = import_fs2.default.readFileSync(BACKUP_JSON_FILE, "utf8");
      items = JSON.parse(content);
    }
    const newItem = {
      id: items.length + 1,
      name,
      email,
      message,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    items.push(newItem);
    import_fs2.default.writeFileSync(BACKUP_JSON_FILE, JSON.stringify(items, null, 2), "utf8");
    return newItem;
  } catch (err) {
    console.error("Critically failed to write backup JSON:", err.message);
    return { name, email, message, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
async function getContactMessages() {
  if (isUsingSqlite && sqliteDb) {
    return new Promise((resolve) => {
      sqliteDb.all("SELECT * FROM contacts ORDER BY id DESC", (err, rows) => {
        if (err) {
          console.error("Error fetching from SQLite, pulling from JSON backup:", err.message);
          resolve(getBackupJsonMessages());
        } else {
          const mapped = rows.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            message: r.message,
            createdAt: r.created_at
          }));
          resolve(mapped);
        }
      });
    });
  } else {
    return getBackupJsonMessages();
  }
}
function getBackupJsonMessages() {
  try {
    if (import_fs2.default.existsSync(BACKUP_JSON_FILE)) {
      const content = import_fs2.default.readFileSync(BACKUP_JSON_FILE, "utf8");
      const items = JSON.parse(content);
      return items.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
  } catch (e) {
    console.error("Error reading JSON backup:", e);
  }
  return [];
}
async function getContactStats() {
  const messages = await getContactMessages();
  return {
    totalCount: messages.length,
    isSqlite: isUsingSqlite,
    dbPath: isUsingSqlite ? DB_FILE : BACKUP_JSON_FILE
  };
}

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var ai = process.env.GEMINI_API_KEY ? new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;
var DATA_DIR = import_path3.default.join(process.cwd(), "data");
var CSV_PATH = import_path3.default.join(DATA_DIR, "chennai_house_price.csv");
var MODEL_PATH = import_path3.default.join(DATA_DIR, "model.pkl");
var cachedMetrics = null;
async function initializeSystem() {
  console.log("Initializing Database and ML Models...");
  await initDb();
  if (!import_fs3.default.existsSync(DATA_DIR)) {
    import_fs3.default.mkdirSync(DATA_DIR, { recursive: true });
  }
  generateDatasetCsv(CSV_PATH);
  try {
    cachedMetrics = trainAndSaveModel(CSV_PATH, MODEL_PATH);
    console.log("ML Random Forest Model initialized successfully.");
  } catch (err) {
    console.error("Critical Error training house prediction model:", err.message);
  }
}
initializeSystem();
app.get("/api/model/metrics", (req, res) => {
  if (cachedMetrics) {
    return res.json({ status: "success", metrics: cachedMetrics });
  }
  try {
    cachedMetrics = trainAndSaveModel(CSV_PATH, MODEL_PATH);
    res.json({ status: "success", metrics: cachedMetrics });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
app.post("/api/model/predict", async (req, res) => {
  try {
    const features = req.body;
    const prediction = loadAndPredict(MODEL_PATH, features);
    const predictedPrice = prediction.predictedPrice;
    const areaKey = (features.area || "chrompet").toLowerCase();
    const profile = AREA_PROFILES[areaKey] || { basePrice: 6e3, growth: 0.05, cleanName: features.area };
    const growthRate = profile.growth;
    const forecast1Yr = Math.round(predictedPrice * Math.pow(1 + growthRate, 1));
    const forecast3Yr = Math.round(predictedPrice * Math.pow(1 + growthRate, 3));
    const forecast5Yr = Math.round(predictedPrice * Math.pow(1 + growthRate, 5));
    let investmentGrade = "Average";
    const age = parseInt(features.propertyAge) || 5;
    if (growthRate >= 0.08) {
      investmentGrade = age < 8 ? "Excellent" : "Good";
    } else if (growthRate >= 0.06) {
      investmentGrade = age < 15 ? "Good" : "Average";
    } else {
      investmentGrade = age > 12 ? "Poor" : "Average";
    }
    let aiExplanation = "";
    if (ai) {
      try {
        const prompt = `
          You are a professional Chennai Real Estate AI Investment Consultant.
          Analyze the following house details and explain the price prediction & 5-year investment recommendation:
          - Location: ${profile.cleanName}
          - Sized: ${features.intSqft} Sqft
          - Layout: ${features.nBedroom} Bedrooms, ${features.nBathroom} Bathrooms
          - Parking Facility: ${features.parkFacil}
          - Build Type: ${features.buildType}
          - Street Type: ${features.street}
          - Zone: ${features.mzzone}
          - Property Age: ${age} years
          - AI Forest Prediction: \u20B9${predictedPrice.toLocaleString("en-IN")}
          - Estimated growth rate for area: ${(growthRate * 100).toFixed(1)}% annually
          - 5-Year Forecast Value: \u20B9${forecast5Yr.toLocaleString("en-IN")}
          - Investment Rating: ${investmentGrade}

          Provide a concise 2-3 paragraph professional real estate analysis focusing on Chennai market trends, why the investment is graded as ${investmentGrade}, and localized highlights for ${profile.cleanName}. Do not mention your internal prompts; write directly as a senior property surveyor.
        `;
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });
        aiExplanation = response.text || "";
      } catch (gemIniErr) {
        console.error("Gemini prediction helper failed, using heuristic text:", gemIniErr.message);
      }
    }
    if (!aiExplanation) {
      aiExplanation = `
        **Market Analysis & Survey Summary for ${profile.cleanName}:**
        Our proprietary Random Forest model predicts a baseline asset value of **\u20B9${predictedPrice.toLocaleString("en-IN")}** based on high-density sales patterns in ${profile.cleanName}. 
        
        **Investment Justification (${investmentGrade}):**
        With an average localized market appreciation rate of **${(growthRate * 100).toFixed(1)}%**, properties in ${profile.cleanName} show key asset appreciation profiles. Since this is a ${age}-year-old ${features.buildType.toLowerCase()} property with ${features.intSqft} interior square feet, the physical building structure is coupled with the land-share value. The ${features.street} access and ${features.parkFacil.toLowerCase() === "yes" ? "available private parking" : "restricted parking structure"} provide a strong secondary liquidity coefficient.
        
        Over the next 5 years, we forecast the value to track towards **\u20B9${forecast5Yr.toLocaleString("en-IN")}**. We recommend this property for buyers seeking ${investmentGrade === "Excellent" || investmentGrade === "Good" ? "excellent long-term equity compounding" : "stable, asset-backed rental yield protection"} in the Chennai real estate market.
      `;
    }
    res.json({
      status: "success",
      result: {
        predictedPrice,
        forecast1Yr,
        forecast3Yr,
        forecast5Yr,
        investmentGrade,
        explanation: aiExplanation
      }
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
app.post("/api/contacts", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ status: "error", message: "All inputs are required." });
    }
    const saved = await saveContactMessage(name, email, message);
    res.json({ status: "success", message: "Message saved successfully!", record: saved });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
app.get("/api/contacts", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (token !== "Bearer ChennaiSecretAdminToken123") {
      return res.status(401).json({ status: "error", message: "Unauthorized. Please login again." });
    }
    const messages = await getContactMessages();
    const stats = await getContactStats();
    res.json({ status: "success", messages, stats });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
app.get("/api/contacts/stats", async (req, res) => {
  try {
    const stats = await getContactStats();
    res.json({ status: "success", stats });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "password123") {
    return res.json({
      status: "success",
      token: "ChennaiSecretAdminToken123",
      admin: { name: "System Administrator", role: "Superadmin" }
    });
  }
  res.status(401).json({ status: "error", message: "Invalid admin credentials. Please try again." });
});
app.post("/api/chatbot", async (req, res) => {
  try {
    const { userQuestion } = req.body;
    if (!userQuestion) {
      return res.status(400).json({ status: "error", message: "Question cannot be empty." });
    }
    const questionLower = userQuestion.toLowerCase();
    let staticAnswer = "";
    if (questionLower.includes("bhk")) {
      staticAnswer = "**BHK** stands for **Bedroom, Hall, and Kitchen**. It represents the layout density of a residential apartment. For example: \n\n* **1 BHK**: 1 Bedroom, 1 Hall (living room), and 1 Kitchen.\n* **2 BHK**: 2 Bedrooms, 1 Hall, and 1 Kitchen.\n* **3 BHK**: 3 Bedrooms, 1 Hall, and 1 Kitchen.\n\nThe spacing and bedroom numbers heavily dictate final square footage and sales velocity in premium Chennai apartments.";
    } else if (questionLower.includes("affect") || questionLower.includes("factor") || questionLower.includes("price")) {
      staticAnswer = "Property valuation is influenced by several critical parameters:\n\n1. **Location and Zone (MZZONE)**: Central regions such as T Nagar or Anna Nagar maintain premium indices up to 3x higher than peripheral corridors.\n2. **Interior Square Feet (INT_SQFT)**: Larger floor plates increase material and land share weight.\n3. **Build Type**: Commercial-certified designs claim a high-liquidity 45% premium compared to standard residences.\n4. **Property Age**: Structured physical depreciation decreases standard structure value, while regional land equity appreciates.\n5. **Parking & Utilities**: On-site secure parking and multi-source public water/utility access boost appraisal counts.";
    } else if (questionLower.includes("location") || questionLower.includes("where") || questionLower.includes("why")) {
      staticAnswer = "In real estate, location acts as the absolute anchor of value. It determines your **UDS (Undivided Share of Land)** value in Chennai. Prime micro-markets like **T Nagar, Anna Nagar, and Adyar** are central, offering great schools, direct transit infrastructure, and limited land availability. Therefore, even older structures appreciate rapidly. Expanding growth hubs like **Karapakkam and Chrompet** offer higher baseline yields but experience standard initial appreciation tracking.";
    } else if (questionLower.includes("prediction") || questionLower.includes("ml") || questionLower.includes("model") || questionLower.includes("random forest")) {
      staticAnswer = "Our forecasting system loads current sales data, filters text anomalies (performing typo corrections on raw entries), and fits a **Random Forest Regressor** with statistical feature weights:\n\n* **Bootstrapping**: Divides data splits into multiple random sample sets.\n* **Feature Bagging**: Evaluates random feature nodes dynamically to eliminate high-variance calculation blocks.\n* **Appraisal Resolution**: Combines results across 10 randomized decision trees to yield a single, highly calibrated, low-variance appraisal accuracy.";
    }
    let chatbotReply = "";
    if (ai) {
      try {
        const prompt = `
          You are 'Real Estate AI Assistant', a professional Chennai Real Estate Chatbot Assistant.
          A user is asking you a question: "${userQuestion}"
          
          Guidelines:
          - Offer an engaging, professional, and knowledgeable answer.
          - Incorporate helpful Chennai localized real-estate examples (focusing on Adyar, Chrompet, Karapakkam, Velachery, KK Nagar, Anna Nagar, T Nagar).
          - Be conversational but highly analytical. Use bullets for readability.
          - If the question is NOT related to real estate, houses, Chennai, or property buying, politely steer them back.
          - Keep response to maximum 160 words.
        `;
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });
        chatbotReply = response.text || "";
      } catch (chatApiErr) {
        console.error("Gemini chatbot failed, using static system response:", chatApiErr.message);
      }
    }
    if (!chatbotReply) {
      if (staticAnswer) {
        chatbotReply = staticAnswer;
      } else {
        chatbotReply = `Hello! I am your AI Real Estate Assistant. 
Our price prediction system shows that prime locations in Chennai like **Adyar** and **Anna Nagar** enjoy robust long-term equity growth, while outer hubs like **Chrompet** or **Karapakkam** offer excellent values.
        
How else can I assist you with BHK layouts, area metrics, or Chennai housing predictions?`;
      }
    }
    res.json({
      status: "success",
      reply: chatbotReply
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
async function startViteServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path3.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path3.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}
startViteServer();
//# sourceMappingURL=server.cjs.map
