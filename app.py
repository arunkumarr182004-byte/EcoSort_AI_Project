import os
import uuid
import csv
import io
from flask import Flask, request, jsonify, render_template, send_file
from werkzeug.utils import secure_filename
from datetime import datetime

import database
import model_helper

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
database.init_db()

# Pre-populate search items database
SEARCH_ITEMS = {
    'battery': {
        'name': 'Household Batteries (AA, AAA, Li-Ion, Rechargeable)',
        'category': 'Hazardous Waste',
        'is_recyclable': False,
        'disposal_method': 'Take to dedicated battery recycling drop-boxes (found in supermarkets or electronic stores). Never throw in trash.',
        'environmental_impact': 'Prevents heavy metals like mercury, lead, and cadmium from contaminating soil and water.',
        'safety_precautions': 'Tape battery terminals (positive/negative ends) to prevent short circuits and fire hazards.',
        'carbon_savings': 0.20
    },
    'light bulb': {
        'name': 'CFL and LED Light Bulbs',
        'category': 'Hazardous Waste',
        'is_recyclable': False,
        'disposal_method': 'Deliver to local hazardous waste disposal sites or home improvement store recycling bins.',
        'environmental_impact': 'CFLs contain small amounts of mercury vapor, which is highly toxic to human and animal neural systems.',
        'safety_precautions': 'Handle with care. If broken, ventilate the room for 15 minutes and sweep up pieces using cardboard, not a vacuum.',
        'carbon_savings': 0.15
    },
    'led bulb': {
        'name': 'LED Bulbs',
        'category': 'Hazardous Waste',
        'is_recyclable': False,
        'disposal_method': 'Recycle through specialized electronics/light bulb recycling stations. Don\'t dump in municipal trash.',
        'environmental_impact': 'LED bulbs contain circuitry and trace heavy metals that can be reclaimed.',
        'safety_precautions': 'Store carefully to prevent breakage. Do not mix with domestic glass.',
        'carbon_savings': 0.15
    },
    'cfl bulb': {
        'name': 'Fluorescent / CFL Bulbs',
        'category': 'Hazardous Waste',
        'is_recyclable': False,
        'disposal_method': 'Take to hazardous waste collection centers. Recycle at retail depots.',
        'environmental_impact': 'Contains toxic mercury vapor.',
        'safety_precautions': 'Never crush. If shattered, clean up with sticky tape or wet wipes, seal in a bag, and take to a hazardous depot.',
        'carbon_savings': 0.15
    },
    'paint': {
        'name': 'Liquid Paints & Varnishes',
        'category': 'Hazardous Waste',
        'is_recyclable': False,
        'disposal_method': 'Let liquid latex paint dry completely or mix with cat litter before disposal. Oil paints must go to hazardous drop-offs.',
        'environmental_impact': 'Liquid paint releases volatile organic compounds (VOCs) that damage air quality and groundwater.',
        'safety_precautions': 'Wear gloves, keep lids tightly shut during storage, and keep away from heat sources or open fires.',
        'carbon_savings': 0.25
    },
    'plastic bottle': {
        'name': 'PET Plastic Bottles (Soda, Water, Juice)',
        'category': 'Plastic',
        'is_recyclable': True,
        'disposal_method': 'Empty contents, rinse, crush, and place in the green recycling bin with caps screwed on.',
        'environmental_impact': 'Reduces the demand for virgin plastic production, saving energy and oil. Keeps bottles out of the ocean.',
        'safety_precautions': 'Ensure they are fully emptied and flattened to optimize collection bin volume.',
        'carbon_savings': 0.10
    },
    'plastic bag': {
        'name': 'Single-use Plastic Shopping Bags',
        'category': 'Plastic',
        'is_recyclable': True,
        'disposal_method': 'Take to dedicated retail/grocery store drop-offs. Do NOT put in standard home curbside recycling as they tangle machinery.',
        'environmental_impact': 'Prevents wildlife ingestion and decreases plastic pollution in terrestrial and marine ecosystems.',
        'safety_precautions': 'Ensure bag is clean, dry, and empty of any food residue or receipts.',
        'carbon_savings': 0.05
    },
    'water bottle': {
        'name': 'Plastic Water Bottles',
        'category': 'Plastic',
        'is_recyclable': True,
        'disposal_method': 'Rinse, crush, and discard in green plastic recycling bin.',
        'environmental_impact': 'Saves crude oil and prevents marine litter.',
        'safety_precautions': 'Remove labels if possible; make sure no liquid remains inside.',
        'carbon_savings': 0.10
    },
    'shampoo bottle': {
        'name': 'HDPE Plastic Bottles (Shampoo, Detergent)',
        'category': 'Plastic',
        'is_recyclable': True,
        'disposal_method': 'Rinse thoroughly to remove soap residue, replace caps, and put in your recycling bin.',
        'environmental_impact': 'HDPE is highly recyclable and can be processed into new bottles, pipes, or plastic lumber.',
        'safety_precautions': 'Empty completely. Residual soap can contaminate other recycled plastics.',
        'carbon_savings': 0.12
    },
    'newspaper': {
        'name': 'Newspapers and Flyers',
        'category': 'Paper',
        'is_recyclable': True,
        'disposal_method': 'Place in the blue paper recycling bin. Keep dry and unsoiled.',
        'environmental_impact': 'Preserves trees, reduces landfill volume, and requires much less energy than pulping raw wood.',
        'safety_precautions': 'Remove any plastic wrapping or plastic bags before recycling.',
        'carbon_savings': 0.05
    },
    'cardboard': {
        'name': 'Cardboard and Shipping Boxes',
        'category': 'Paper',
        'is_recyclable': True,
        'disposal_method': 'Flatten completely, remove packing tape and labels where possible, and place in the blue recycling bin.',
        'environmental_impact': 'Saves forestry resources. Cardboard fibers are long and can be recycled up to 7 times.',
        'safety_precautions': 'Keep dry. Wet cardboard clogs sorting facility machines and cannot be processed.',
        'carbon_savings': 0.08
    },
    'box': {
        'name': 'Cardboard Box',
        'category': 'Paper',
        'is_recyclable': True,
        'disposal_method': 'Flatten, remove plastic tapes/fillers, and place in the paper bin.',
        'environmental_impact': 'Prevents deforestation and reduces municipal solid waste.',
        'safety_precautions': 'Keep away from oils, grease, and rain.',
        'carbon_savings': 0.08
    },
    'pizza box': {
        'name': 'Cardboard Pizza Box',
        'category': 'Organic Waste',
        'is_recyclable': False,
        'disposal_method': 'If stained with grease/cheese, dispose in the organic waste/compost bin. If completely clean, recycle as paper.',
        'environmental_impact': 'Grease contaminates recycling batches. Composting turns food-soiled cardboard into rich agricultural mulch.',
        'safety_precautions': 'Ensure no leftover food crusts, dipping cups, or plastic supports are left inside.',
        'carbon_savings': 0.04
    },
    'banana peel': {
        'name': 'Banana Peels & Fruit Scraps',
        'category': 'Organic Waste',
        'is_recyclable': False,
        'disposal_method': 'Place in organic waste/compost collector. Ideal for home composting setups.',
        'environmental_impact': 'Prevents anaerobic decomposition in landfills which generates harmful methane gas.',
        'safety_precautions': 'Remove any stickers/labels commonly stuck to fruit skins before composting.',
        'carbon_savings': 0.08
    },
    'food scraps': {
        'name': 'Vegetable Peels and Food Leftovers',
        'category': 'Organic Waste',
        'is_recyclable': False,
        'disposal_method': 'Discard in organic/compost bin or backyard composter.',
        'environmental_impact': 'Rich nutrients are returned to the soil rather than decomposing in a landfill.',
        'safety_precautions': 'Avoid placing meat, dairy, bones, or cooking oils in normal backyard compost bins as they attract pests.',
        'carbon_savings': 0.08
    },
    'apple core': {
        'name': 'Fruit Leftovers (Apple cores, pear skins, etc.)',
        'category': 'Organic Waste',
        'is_recyclable': False,
        'disposal_method': 'Dispose in organic waste bin or backyard compost pile.',
        'environmental_impact': 'Decomposes naturally to enrich soil with nitrogen and carbon.',
        'safety_precautions': 'Ensure no plastic stickers are left on fruit skin.',
        'carbon_savings': 0.08
    },
    'egg shells': {
        'name': 'Egg Shells',
        'category': 'Organic Waste',
        'is_recyclable': False,
        'disposal_method': 'Add directly to compost. Excellent calcium source for garden soil.',
        'environmental_impact': 'Enriches agricultural soil, avoiding artificial fertilizer use.',
        'safety_precautions': 'Crush slightly to accelerate decomposition.',
        'carbon_savings': 0.05
    },
    'aluminum can': {
        'name': 'Aluminum Soda & Beverage Cans',
        'category': 'Metal',
        'is_recyclable': True,
        'disposal_method': 'Rinse out remaining liquid, compress to save space, and place in the metal recycling bin.',
        'environmental_impact': 'Recycling aluminum saves 95% of the energy required to make it from raw bauxite ore.',
        'safety_precautions': 'Be careful of sharp edges on opened cans.',
        'carbon_savings': 0.25
    },
    'soda can': {
        'name': 'Metal Soda Cans',
        'category': 'Metal',
        'is_recyclable': True,
        'disposal_method': 'Rinse, crush, and put in the metal/can bin.',
        'environmental_impact': 'Highly efficient recycling process; can return to store shelves in 60 days.',
        'safety_precautions': 'Ensure no liquids are inside to avoid attracting pests.',
        'carbon_savings': 0.25
    },
    'tin can': {
        'name': 'Steel / Tin Food Cans (Soup, Tuna)',
        'category': 'Metal',
        'is_recyclable': True,
        'disposal_method': 'Rinse thoroughly to remove food residue. You can place the lid inside the can, and drop in the recycling bin.',
        'environmental_impact': 'Steel is 100% recyclable and is the most recycled material on the planet.',
        'safety_precautions': 'Lids can be extremely sharp. Handle with caution.',
        'carbon_savings': 0.20
    },
    'glass jar': {
        'name': 'Glass Food Jars (Jam, Pasta Sauce)',
        'category': 'Glass',
        'is_recyclable': True,
        'disposal_method': 'Rinse out food, remove metal lid (recycle lid separately as metal), and put jar in the glass collection bin.',
        'environmental_impact': 'Reduces furnace temperatures during new glass production, saving fuel and reducing emissions.',
        'safety_precautions': 'Never put drinking glasses, Pyrex, or window panes in curbside glass recycling (they melt at different temps).',
        'carbon_savings': 0.15
    },
    'wine bottle': {
        'name': 'Glass Wine and Beer Bottles',
        'category': 'Glass',
        'is_recyclable': True,
        'disposal_method': 'Empty contents, rinse, and place in the glass bin (separate by color if requested locally).',
        'environmental_impact': 'Glass is 100% recyclable infinitely without losing strength or purity.',
        'safety_precautions': 'Keep bottle intact. Broken glass is dangerous to collection workers.',
        'carbon_savings': 0.15
    },
    'laptop': {
        'name': 'Old Laptops & Personal Computers',
        'category': 'E-Waste',
        'is_recyclable': True,
        'disposal_method': 'Bring to electronic recycling depots or retail take-back programs. Do not put in residential bins.',
        'environmental_impact': 'Saves rare earth metals and prevents mercury, lead, and flame retardants from contaminating groundwater.',
        'safety_precautions': 'Wipe personal data off hard drives before recycling. Remove batteries and recycle them separately.',
        'carbon_savings': 0.25
    },
    'phone': {
        'name': 'Smartphones & Cellphones',
        'category': 'E-Waste',
        'is_recyclable': True,
        'disposal_method': 'Donate, trade-in, or drop off at specialized electronics recycling kiosks (e.g., in retail malls).',
        'environmental_impact': 'Reclaims valuable metals like gold, copper, silver, and palladium.',
        'safety_precautions': 'Reset to factory settings. Take out SIM card and micro-SD.',
        'carbon_savings': 0.20
    },
    'keyboard': {
        'name': 'Computer Keyboards & Mice',
        'category': 'E-Waste',
        'is_recyclable': True,
        'disposal_method': 'Take to an electronics collection center or office supply store recycling bin.',
        'environmental_impact': 'Reclaims plastic housing and electronic wiring, reducing e-waste landfill volume.',
        'safety_precautions': 'Cut cords if requested by collection points, or bundle cords neatly.',
        'carbon_savings': 0.15
    }
}

# Helper check for extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def scan_waste():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed. Please upload JPG, PNG, JPEG, or WEBP.'}), 400
        
    try:
        # Generate clean unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"scan_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:6]}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save file
        file.save(filepath)
        
        # Run prediction
        result = model_helper.predict_waste(filepath)
        
        # Save to database
        scan_id = database.add_scan(
            filename=unique_filename,
            category=result['category'],
            confidence=result['confidence'],
            is_recyclable=result['is_recyclable'],
            disposal_method=result['disposal_method'],
            environmental_impact=result['environmental_impact'],
            safety_precautions=result['safety_precautions'],
            carbon_savings=result['carbon_savings']
        )
        
        result['id'] = scan_id
        result['filepath'] = f"/static/uploads/{unique_filename}"
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in scan API: {e}")
        return jsonify({'error': f"Internal server error processing image: {str(e)}"}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    scans = database.get_scans()
    # Add filepath to each row
    for scan in scans:
        scan['filepath'] = f"/static/uploads/{scan['filename']}"
    return jsonify(scans)

@app.route('/api/history/<int:scan_id>', methods=['DELETE'])
def delete_history_item(scan_id):
    filename = database.delete_scan(scan_id)
    if filename:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                print(f"Failed to delete file {filepath}: {e}")
        return jsonify({'success': True, 'message': 'Scan history item deleted.'})
    return jsonify({'error': 'Scan item not found.'}), 404

@app.route('/api/history', methods=['DELETE'])
def clear_all_history():
    filenames = database.clear_all_scans()
    deleted_count = 0
    for filename in filenames:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                deleted_count += 1
            except Exception as e:
                print(f"Failed to delete file {filepath}: {e}")
    return jsonify({'success': True, 'message': f'Cleared history and deleted {deleted_count} image files.'})

@app.route('/api/history/download', methods=['GET'])
def download_history():
    scans = database.get_scans()
    
    # Create in-memory CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Scan ID', 'Date & Time', 'Category', 'Confidence (%)', 
        'Recyclable', 'Carbon Savings (kg CO2)', 'Disposal Method', 
        'Environmental Impact', 'Safety Precautions'
    ])
    
    # Rows
    for s in scans:
        writer.writerow([
            s['id'], s['scanned_at'], s['category'], s['confidence'],
            'Yes' if s['is_recyclable'] else 'No', s['carbon_savings'],
            s['disposal_method'], s['environmental_impact'], s['safety_precautions'] or 'N/A'
        ])
        
    # Convert to bytes string
    mem = io.BytesIO()
    mem.write(output.getvalue().encode('utf-8'))
    mem.seek(0)
    output.close()
    
    return send_file(
        mem,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f"ecosort_scans_history_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
    )

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    stats = database.get_dashboard_stats()
    return jsonify(stats)

@app.route('/api/search', methods=['GET'])
def search_disposal():
    query = request.args.get('q', '').strip().lower()
    if not query:
        return jsonify([])
        
    # Log the search query in database
    conn = database.get_db_connection()
    try:
        # Match search query against keyword keys in SEARCH_ITEMS
        matched_results = []
        for key, item in SEARCH_ITEMS.items():
            if query in key or key in query or query in item['name'].lower():
                matched_results.append(item)
                
        # Log to db
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO search_queries (query_text, matched_item) VALUES (?, ?)', 
            (query, matched_results[0]['name'] if matched_results else 'No Match')
        )
        conn.commit()
        
        return jsonify(matched_results)
    except Exception as e:
        print(f"Error in search API: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/contact', methods=['POST'])
def handle_contact_form():
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        message = data.get('message', '').strip()
        
        if not name or not email or not message:
            return jsonify({'error': 'All fields are required.'}), 400
            
        # 1. Save to SQLite
        database.add_contact_message(name, email, message)
        
        # 2. Append to a human-readable text log file in the workspace
        log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'contact_messages.log')
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(f"=== CONTACT MESSAGE RECEIVED ({timestamp}) ===\n")
            f.write(f"Name: {name}\n")
            f.write(f"Email: {email}\n")
            f.write(f"Message:\n{message}\n")
            f.write("=" * 50 + "\n\n")
            
        return jsonify({'success': True, 'message': 'Message stored and logged successfully.'})
    except Exception as e:
        print(f"Error in contact form API: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chatbot_reply():
    data = request.get_json() or {}
    message = data.get('message', '').strip().lower()
    if not message:
        return jsonify({'reply': 'Hello! I am EcoSort AI Chatbot. Ask me any question about sorting waste, carbon footprint, recycling codes, or how to dispose of items!'})
        
    reply = ""
    # Standard responses based on keyword parsing
    if any(k in message for k in ['hello', 'hi', 'hey', 'greetings']):
        reply = "Hello! 👋 I'm your EcoSort Recycling Assistant. How can I help you save the planet today? You can ask me how to dispose of specific items (like batteries or cardboard) or general recycling rules!"
        
    elif any(k in message for k in ['plastic', 'pet', 'hdpe']):
        reply = "Plastic waste is grouped by numbers 1-7. Clean bottles (#1 PET, #2 HDPE) are widely accepted in green curbside bins. Always rinse them out and crush them to save space. Soft plastics like bags must be taken back to grocery stores, not put in regular curbside bins!"
        
    elif any(k in message for k in ['paper', 'cardboard', 'box']):
        reply = "Paper and cardboard should be clean, dry, and flat! Soiled items like greasy pizza boxes cannot be recycled because grease degrades paper fibers. Drop those in the compost bin instead."
        
    elif any(k in message for k in ['battery', 'batteries', 'cell']):
        reply = "⚠️ Batteries are classified as **Hazardous Waste**. They contain mercury, lithium, and lead which can leak or cause landfill fires. Never place them in your trash! Drop them at retail recycle centers or hardware stores."
        
    elif any(k in message for k in ['glass', 'bottle', 'jar']):
        reply = "Glass bottles and jars can be recycled infinitely! Make sure to rinse food residue off. Note: drinking glasses, window glass, and Pyrex ceramics have different melting points and cannot go in standard recycling. Keep those out!"
        
    elif any(k in message for k in ['metal', 'can', 'aluminum', 'soda']):
        reply = "Metal recycling is incredibly efficient! Aluminum cans can be melted down and returned to store shelves in just 60 days. Rinse them out, compress if possible, and toss in the metal recycling bin."
        
    elif any(k in message for k in ['compost', 'organic', 'food', 'banana', 'vegetable']):
        reply = "Organic waste can be turned into rich fertilizer! You can compost fruit scraps, vegetable peelings, coffee grounds, eggshells, and clean paper. Avoid dairy, meat, fats, and dog/cat waste in residential compost bins, as they attract pests."
        
    elif any(k in message for k in ['e-waste', 'electronic', 'phone', 'computer', 'laptop', 'charger']):
        reply = "Electronics (E-Waste) contain rare metals that can be reclaimed, as well as toxics like lead. Take them to designated e-waste drop-off events or electronics retailers (like Best Buy) that offer recycling programs."
        
    elif any(k in message for k in ['carbon', 'co2', 'savings', 'climate', 'impact']):
        reply = "Every item recycled helps! Recycling metal saves up to 0.25 kg CO2 per item, plastic saves 0.10 kg, and glass saves 0.15 kg. Composting organics prevents methane emissions. Cumulatively, proper waste sorting is one of the easiest ways individuals can fight climate change!"
        
    elif any(k in message for k in ['thank', 'thanks', 'cool', 'awesome', 'great']):
        reply = "You're very welcome! 🌍 Remember, every small action counts in building a sustainable future. Ask me anything else anytime!"
        
    else:
        # Fallback to checking our SEARCH_ITEMS database
        matched_item = None
        for key, item in SEARCH_ITEMS.items():
            if key in message:
                matched_item = item
                break
                
        if matched_item:
            reply = f"I found information on **{matched_item['name']}**.\n\n" \
                    f"**Category:** {matched_item['category']}\n" \
                    f"**Disposal Method:** {matched_item['disposal_method']}\n" \
                    f"**Recyclable:** {'Yes' if matched_item['is_recyclable'] else 'No'}\n" \
                    f"**Environmental Impact:** {matched_item['environmental_impact']}"
            if matched_item.get('safety_precautions'):
                reply += f"\n**Safety Precautions:** {matched_item['safety_precautions']}"
        else:
            reply = "I'm not quite sure how to recycle that specific item. Try searching for common materials like 'plastic bottle', 'battery', 'newspaper', or 'glass jar' in our search bar, or specify the material you're asking about!"
            
    return jsonify({'reply': reply})

if __name__ == '__main__':
    # Running locally in debug mode
    app.run(host='127.0.0.1', port=5000, debug=True)
