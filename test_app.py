import os
import unittest
import json
import sqlite3
import database
import model_helper
import app as flask_app

class TestEcoSortSystem(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Initialize database using schema
        database.init_db()
        
        # Ensure we have at least one sample image to test
        cls.test_image_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'samples')
        cls.test_image_path = os.path.join(cls.test_image_dir, 'plastic_bottle.png')
        
    def test_database_initialization(self):
        """Test database tables are created correctly."""
        conn = database.get_db_connection()
        cursor = conn.cursor()
        
        # Check table scans exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='scans'")
        table_exists = cursor.fetchone()
        self.assertIsNotNone(table_exists, "Table 'scans' should exist in the SQLite database")
        
        # Check table search_queries exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='search_queries'")
        search_table_exists = cursor.fetchone()
        self.assertIsNotNone(search_table_exists, "Table 'search_queries' should exist in the SQLite database")
        
        conn.close()
        
    def test_database_operations(self):
        """Test inserting, retrieving, and deleting scans from the database."""
        # 1. Insert a scan
        scan_id = database.add_scan(
            filename='test_sample_img.png',
            category='Paper',
            confidence=94.5,
            is_recyclable=True,
            disposal_method='Rinse and recycle',
            environmental_impact='Saves trees',
            safety_precautions='None',
            carbon_savings=0.08
        )
        self.assertIsNotNone(scan_id, "Scan ID should be returned upon insertion")
        
        # 2. Get scans
        scans = database.get_scans()
        self.assertTrue(len(scans) > 0, "There should be at least one scan log in database")
        
        test_scan = None
        for s in scans:
            if s['id'] == scan_id:
                test_scan = s
                break
                
        self.assertIsNotNone(test_scan, "Inserted scan should be retrievable")
        self.assertEqual(test_scan['category'], 'Paper')
        self.assertEqual(test_scan['confidence'], 94.5)
        
        # 3. Fetch stats
        stats = database.get_dashboard_stats()
        self.assertIn('total_scans', stats)
        self.assertIn('recycling_percentage', stats)
        self.assertIn('total_carbon_savings', stats)
        self.assertIn('category_distribution', stats)
        self.assertIn('daily_scans', stats)
        
        # 4. Clean up
        deleted_file = database.delete_scan(scan_id)
        self.assertEqual(deleted_file, 'test_sample_img.png', "Should return the deleted filename")
        
    def test_model_mapping(self):
        """Test label mapping to categories in model_helper."""
        # Test mapping
        self.assertEqual(model_helper.map_label_to_category('water bottle'), 'Plastic')
        self.assertEqual(model_helper.map_label_to_category('envelopes'), 'Paper')
        self.assertEqual(model_helper.map_label_to_category('wine glass'), 'Glass')
        self.assertEqual(model_helper.map_label_to_category('soda can'), 'Metal')
        self.assertEqual(model_helper.map_label_to_category('banana skin'), 'Organic Waste')
        self.assertEqual(model_helper.map_label_to_category('keyboard mouse'), 'E-Waste')
        self.assertEqual(model_helper.map_label_to_category('lead acid battery'), 'Hazardous Waste')
        
    def test_model_prediction(self):
        """Test model inference function."""
        # Use our generated test sample
        if os.path.exists(self.test_image_path):
            result = model_helper.predict_waste(self.test_image_path)
            self.assertIn('category', result)
            self.assertIn('confidence', result)
            self.assertIn('is_recyclable', result)
            self.assertIn('disposal_method', result)
            
            # Since the image is synthetic, verify the prediction returns a valid waste category string
            self.assertIn(result['category'], ['Plastic', 'Paper', 'Glass', 'Metal', 'Organic Waste', 'E-Waste', 'Hazardous Waste'])
            
    def test_flask_endpoints(self):
        """Test Flask server REST API responses."""
        # Create test client
        client = flask_app.app.test_client()
        
        # 1. Home page renders
        res = client.get('/')
        self.assertEqual(res.status_code, 200)
        
        # 2. Get history log
        res = client.get('/api/history')
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(json.loads(res.data), list)
        
        # 3. Get Dashboard
        res = client.get('/api/dashboard')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('total_scans', data)
        self.assertIn('recycling_percentage', data)
        
        # 4. Search query
        res = client.get('/api/search?q=battery')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(len(data) > 0)
        self.assertEqual(data[0]['category'], 'Hazardous Waste')
        
        # 5. Chatbot answer
        res = client.post('/api/chat', 
                          data=json.dumps({'message': 'Can I recycle pizza boxes?'}),
                          content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('reply', data)
        self.assertIn('compost', data['reply'].lower())
        
        # 6. Contact message submission
        res = client.post('/api/contact',
                          data=json.dumps({
                              'name': 'Test User',
                              'email': 'test@example.com',
                              'message': 'Hello, this is a test message.'
                          }),
                          content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data.get('success'))

if __name__ == '__main__':
    unittest.main()

