import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  generateDatasetCsv, 
  trainAndSaveModel, 
  loadAndPredict, 
  AREA_PROFILES, 
  CATEGORICAL_MAPS 
} from './src/lib/ml';
import { 
  initDb, 
  saveContactMessage, 
  getContactMessages, 
  getContactStats 
} from './src/db';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

// Paths
const DATA_DIR = path.join(process.cwd(), 'data');
const CSV_PATH = path.join(DATA_DIR, 'chennai_house_price.csv');
const MODEL_PATH = path.join(DATA_DIR, 'model.pkl');

let cachedMetrics: any = null;

// System initialization
async function initializeSystem() {
  console.log('Initializing Database and ML Models...');
  
  // 1. Init SQL/JSON Database
  await initDb();

  // 2. Setup Data Directories
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 3. Generate CSV Dataset if missing
  generateDatasetCsv(CSV_PATH);

  // 4. Train Random Forest Model
  try {
    cachedMetrics = trainAndSaveModel(CSV_PATH, MODEL_PATH);
    console.log('ML Random Forest Model initialized successfully.');
  } catch (err: any) {
    console.error('Critical Error training house prediction model:', err.message);
  }
}

// Ensure init runs
initializeSystem();

// API ROUTES BEFORE VITE MIDDLEWARE

// 1. Get Model Metrics
app.get('/api/model/metrics', (req, res) => {
  if (cachedMetrics) {
    return res.json({ status: 'success', metrics: cachedMetrics });
  }
  
  // Re-train if cache was somehow cleared
  try {
    cachedMetrics = trainAndSaveModel(CSV_PATH, MODEL_PATH);
    res.json({ status: 'success', metrics: cachedMetrics });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. Predict House Price and Forecast Values
app.post('/api/model/predict', async (req, res) => {
  try {
    const features = req.body;
    
    // Evaluate via Random Forest Regressor
    const prediction = loadAndPredict(MODEL_PATH, features);
    const predictedPrice = prediction.predictedPrice;
    
    // Growth rates based on Chennai profile
    const areaKey = (features.area || 'chrompet').toLowerCase();
    const profile = AREA_PROFILES[areaKey] || { basePrice: 6000, growth: 0.05, cleanName: features.area };
    const growthRate = profile.growth;

    // Calculate forecasts using compounding rate
    const forecast1Yr = Math.round(predictedPrice * Math.pow(1 + growthRate, 1));
    const forecast3Yr = Math.round(predictedPrice * Math.pow(1 + growthRate, 3));
    const forecast5Yr = Math.round(predictedPrice * Math.pow(1 + growthRate, 5));

    // Determine Investment Recommendation Grade
    let investmentGrade: 'Poor' | 'Average' | 'Good' | 'Excellent' = 'Average';
    const age = parseInt(features.propertyAge) || 5;

    if (growthRate >= 0.08) {
      investmentGrade = age < 8 ? 'Excellent' : 'Good';
    } else if (growthRate >= 0.06) {
      investmentGrade = age < 15 ? 'Good' : 'Average';
    } else {
      investmentGrade = age > 12 ? 'Poor' : 'Average';
    }

    // AI dynamic commentary from Gemini
    let aiExplanation = '';

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
          - AI Forest Prediction: ₹${predictedPrice.toLocaleString('en-IN')}
          - Estimated growth rate for area: ${(growthRate * 100).toFixed(1)}% annually
          - 5-Year Forecast Value: ₹${forecast5Yr.toLocaleString('en-IN')}
          - Investment Rating: ${investmentGrade}

          Provide a concise 2-3 paragraph professional real estate analysis focusing on Chennai market trends, why the investment is graded as ${investmentGrade}, and localized highlights for ${profile.cleanName}. Do not mention your internal prompts; write directly as a senior property surveyor.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });

        aiExplanation = response.text || '';
      } catch (gemIniErr: any) {
        console.error('Gemini prediction helper failed, using heuristic text:', gemIniErr.message);
      }
    }

    // Fallback or backup heuristic text if Gemini is not available or errors out
    if (!aiExplanation) {
      aiExplanation = `
        **Market Analysis & Survey Summary for ${profile.cleanName}:**
        Our proprietary Random Forest model predicts a baseline asset value of **₹${predictedPrice.toLocaleString('en-IN')}** based on high-density sales patterns in ${profile.cleanName}. 
        
        **Investment Justification (${investmentGrade}):**
        With an average localized market appreciation rate of **${(growthRate * 100).toFixed(1)}%**, properties in ${profile.cleanName} show key asset appreciation profiles. Since this is a ${age}-year-old ${features.buildType.toLowerCase()} property with ${features.intSqft} interior square feet, the physical building structure is coupled with the land-share value. The ${features.street} access and ${features.parkFacil.toLowerCase() === 'yes' ? 'available private parking' : 'restricted parking structure'} provide a strong secondary liquidity coefficient.
        
        Over the next 5 years, we forecast the value to track towards **₹${forecast5Yr.toLocaleString('en-IN')}**. We recommend this property for buyers seeking ${investmentGrade === 'Excellent' || investmentGrade === 'Good' ? 'excellent long-term equity compounding' : 'stable, asset-backed rental yield protection'} in the Chennai real estate market.
      `;
    }

    res.json({
      status: 'success',
      result: {
        predictedPrice,
        forecast1Yr,
        forecast3Yr,
        forecast5Yr,
        investmentGrade,
        explanation: aiExplanation
      }
    });

  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. Contact Messages - Save contacts
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ status: 'error', message: 'All inputs are required.' });
    }

    const saved = await saveContactMessage(name, email, message);
    res.json({ status: 'success', message: 'Message saved successfully!', record: saved });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. Contact Messages - Retrive (Admin required)
app.get('/api/contacts', async (req, res) => {
  try {
    // Basic verification token header checking
    const token = req.headers.authorization;
    if (token !== 'Bearer ChennaiSecretAdminToken123') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized. Please login again.' });
    }

    const messages = await getContactMessages();
    const stats = await getContactStats();
    res.json({ status: 'success', messages, stats });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 5. Contact stats
app.get('/api/contacts/stats', async (req, res) => {
  try {
    const stats = await getContactStats();
    res.json({ status: 'success', stats });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 6. Admin Authentication Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password123') {
    return res.json({
      status: 'success',
      token: 'ChennaiSecretAdminToken123',
      admin: { name: 'System Administrator', role: 'Superadmin' }
    });
  }
  res.status(401).json({ status: 'error', message: 'Invalid admin credentials. Please try again.' });
});

// 7. Chatbot Assistant Q&A
app.post('/api/chatbot', async (req, res) => {
  try {
    const { userQuestion } = req.body;
    if (!userQuestion) {
      return res.status(400).json({ status: 'error', message: 'Question cannot be empty.' });
    }

    // Static responsive mapping for rule-based speed/fallback
    const questionLower = userQuestion.toLowerCase();
    let staticAnswer = '';

    if (questionLower.includes('bhk')) {
      staticAnswer = "**BHK** stands for **Bedroom, Hall, and Kitchen**. It represents the layout density of a residential apartment. For example: \n\n* **1 BHK**: 1 Bedroom, 1 Hall (living room), and 1 Kitchen.\n* **2 BHK**: 2 Bedrooms, 1 Hall, and 1 Kitchen.\n* **3 BHK**: 3 Bedrooms, 1 Hall, and 1 Kitchen.\n\nThe spacing and bedroom numbers heavily dictate final square footage and sales velocity in premium Chennai apartments.";
    } else if (questionLower.includes('affect') || questionLower.includes('factor') || questionLower.includes('price')) {
      staticAnswer = "Property valuation is influenced by several critical parameters:\n\n1. **Location and Zone (MZZONE)**: Central regions such as T Nagar or Anna Nagar maintain premium indices up to 3x higher than peripheral corridors.\n2. **Interior Square Feet (INT_SQFT)**: Larger floor plates increase material and land share weight.\n3. **Build Type**: Commercial-certified designs claim a high-liquidity 45% premium compared to standard residences.\n4. **Property Age**: Structured physical depreciation decreases standard structure value, while regional land equity appreciates.\n5. **Parking & Utilities**: On-site secure parking and multi-source public water/utility access boost appraisal counts.";
    } else if (questionLower.includes('location') || questionLower.includes('where') || questionLower.includes('why')) {
      staticAnswer = "In real estate, location acts as the absolute anchor of value. It determines your **UDS (Undivided Share of Land)** value in Chennai. Prime micro-markets like **T Nagar, Anna Nagar, and Adyar** are central, offering great schools, direct transit infrastructure, and limited land availability. Therefore, even older structures appreciate rapidly. Expanding growth hubs like **Karapakkam and Chrompet** offer higher baseline yields but experience standard initial appreciation tracking.";
    } else if (questionLower.includes('prediction') || questionLower.includes('ml') || questionLower.includes('model') || questionLower.includes('random forest')) {
      staticAnswer = "Our forecasting system loads current sales data, filters text anomalies (performing typo corrections on raw entries), and fits a **Random Forest Regressor** with statistical feature weights:\n\n* **Bootstrapping**: Divides data splits into multiple random sample sets.\n* **Feature Bagging**: Evaluates random feature nodes dynamically to eliminate high-variance calculation blocks.\n* **Appraisal Resolution**: Combines results across 10 randomized decision trees to yield a single, highly calibrated, low-variance appraisal accuracy.";
    }

    let chatbotReply = '';

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
          model: 'gemini-3.5-flash',
          contents: prompt
        });

        chatbotReply = response.text || '';
      } catch (chatApiErr: any) {
        console.error('Gemini chatbot failed, using static system response:', chatApiErr.message);
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
      status: 'success',
      reply: chatbotReply
    });

  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});


// MOUNT VITE MIDDLEWARE AFTER API ROUTES
async function startViteServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startViteServer();
