# EcoSort AI – Smart Waste Segregation System

EcoSort AI is a modern, responsive, AI-powered web application designed to help users identify household waste categories from uploaded photos and provide localized disposal guidelines, environmental impact profiles, and safety measures.

The system is optimized to run locally on CPU, using a pre-trained **MobileNetV2 CNN** model loaded via **ONNX Runtime** for high-speed local inference without heavy GPU or cloud API requirements.

---

## 🌟 Key Features

1. **Attractive Eco-Friendly UI**: Premium glassmorphism layout, clean harmonies using HSL green/blue variables, and a smooth theme transition.
2. **AI Waste Classification**: Instantly predict the waste category from 7 options:
   * **Plastic** • **Paper** • **Glass** • **Metal** • **Organic Waste** • **E-Waste** • **Hazardous Waste**
3. **Disposal Guidance & Safeties**: Shows confidence metrics, carbon CO₂ footprint savings, correct disposal directions, environmental benefits, and safety warnings for toxics.
4. **Disposal Search Bar**: Instantly lookup sorting rules for common items (e.g. batteries, CFL bulbs, soda cans) using fuzzy keyword matching.
5. **Interactive Eco-Map**: Displays localized recycling drop-offs, compost yards, and electronic centers on an interactive **Leaflet.js** map.
6. **Analytics Dashboard**: Dynamic metrics showing total scans, overall recycling rate, total carbon offset, and gamified Ranger levels. Visualized via **Chart.js** (Pie and Line charts).
7. **Scan History Logs**: SQLite-backed history tracking. Browse past images, toggle descriptions, delete records, or download logs as a **CSV** sheet.
8. **Hands-free Voice Commands**: Uses browser **Web Speech API** dictation for search queries and chatbot inputs.
9. **Interactive Recycling Chatbot**: Virtual eco-assistant to answer general queries (e.g. "Can I compost pizza boxes?").

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, Vanilla CSS3 (Custom Properties & Glassmorphism), ES6 JavaScript, Chart.js, Leaflet.js
* **Backend**: Python Flask
* **Database**: SQLite3
* **AI Model Engine**: ONNX Runtime, NumPy, Pillow (MobileNetV2 CNN weight mapping)

---

## 📂 Project Directory Structure

```
finalproject/
│
├── app.py                     # Flask backend routing & REST APIs
├── database.py                # Database connection & querying layer
├── model_helper.py            # ONNX image classification & category mapping
├── schema.sql                 # SQLite schema creation queries
├── requirements.txt           # Python dependencies
├── create_samples.py          # Script to generate sample waste images
├── test_app.py                # Automated unittest suite
├── README.md                  # Setup and usage manual
│
├── samples/                   # Pre-generated waste images for quick testing
│   ├── plastic_bottle.png
│   ├── paper_box.png
│   ├── glass_jar.png
│   ├── metal_can.png
│   ├── organic_food.png
│   ├── ewaste_keyboard.png
│   └── hazardous_battery.png
│
├── static/
│   ├── css/
│   │   └── style.css          # Glassmorphic, light/dark responsive CSS stylesheet
│   ├── js/
│   │   ├── app.js             # Client SPA router, upload handlers, map markers
│   │   ├── dashboard.js       # Chart.js pie & gradient line chart renderers
│   │   ├── voice.js           # Web Speech API microphone dictation script
│   │   └── chatbot.js         # Chat panel overlay & AI chat bubbles controller
│   └── uploads/               # Directory where user uploaded images are saved
│
└── templates/
    └── index.html             # Core Single Page Application HTML layout
```

---

## 🚀 Setup & Installation Instructions

### Prerequisites
* Ensure you have **Python 3.10+** installed on your system.

### 1. Initialize Project & Install Dependencies
Open your command terminal, navigate to the project directory, and run the following command to install the required Python packages:

```bash
pip install -r requirements.txt
```

### 2. Generate Sample Images (Optional)
The project comes with a generator script to create mock waste photos locally for instant testing. If not already generated, run:

```bash
python create_samples.py
```
This creates a `samples/` folder containing colored PNG images (e.g., `plastic_bottle.png`, `hazardous_battery.png`) that are mapped to trigger specific waste streams in the AI classifier.

### 3. Launch the Server
Start the Flask development server:

```bash
python app.py
```

By default, the server runs on `http://127.0.0.1:5000/`.

### 4. Open in Browser
Open your web browser and navigate to:
[**http://127.0.0.1:5000/**](http://127.0.0.1:5000/)

---

## ⚙️ How the AI Classifier Works (Inference & Fallbacks)

On server startup, `model_helper.py` attempts to pull the lightweight pre-trained **MobileNetV2 ONNX model** (approx. 13MB) from the official ONNX/Hugging Face zoo, alongside the standard **ImageNet 1000 Class Labels** list.

* **Image Preprocessing**: Uploaded images are resized to `224x224` pixels, converted to float32, normalized using standard ImageNet mean/standard deviations, and fed to the ONNX session.
* **Label Mapping**: The model's 1000 class labels are analyzed for keywords. For example, if the top predicted label is "wine bottle" or "goblet", it is matched to **Glass**, which loads the corresponding glass recycling details.
* **Safety Fallback**: If the server has no internet access to download weights, or if the ONNX loader fails, the backend automatically transitions to a **smart ruleset**. It inspects the uploaded filename for keywords (e.g. searching "battery" -> classifies as *Hazardous Waste* with simulated confidence) to ensure the system is **fully functional and testable offline**.

---

## 🗄️ SQL Schema Specification

SQLite stores records under `database.db` with two tables:

### Scans Log Table
```sql
CREATE TABLE scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence REAL NOT NULL,
    is_recyclable INTEGER NOT NULL, -- 1 for True, 0 for False
    disposal_method TEXT NOT NULL,
    environmental_impact TEXT NOT NULL,
    safety_precautions TEXT,
    carbon_savings REAL NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Queries Log Table
```sql
CREATE TABLE search_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_text TEXT NOT NULL,
    matched_item TEXT NOT NULL,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧪 Testing and Verification

To run the automated suite testing SQL logs, keyword mappings, and Flask router clients:

```bash
python -m unittest test_app.py
```
All outputs should return `OK`.
