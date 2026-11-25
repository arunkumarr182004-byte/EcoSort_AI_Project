import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'schema.sql')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"Schema file not found at {SCHEMA_PATH}")
    
    conn = get_db_connection()
    try:
        with open(SCHEMA_PATH, 'r') as f:
            conn.executescript(f.read())
        conn.commit()
    except Exception as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()

def add_scan(filename, category, confidence, is_recyclable, disposal_method, environmental_impact, safety_precautions, carbon_savings):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO scans (
                filename, category, confidence, is_recyclable, 
                disposal_method, environmental_impact, safety_precautions, carbon_savings
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            filename, category, confidence, 1 if is_recyclable else 0,
            disposal_method, environmental_impact, safety_precautions, carbon_savings
        ))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error adding scan: {e}")
        return None
    finally:
        conn.close()

def get_scans():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM scans ORDER BY scanned_at DESC')
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching scans: {e}")
        return []
    finally:
        conn.close()

def delete_scan(scan_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    filename = None
    try:
        # Retrieve the filename first so the backend can delete the physical file
        cursor.execute('SELECT filename FROM scans WHERE id = ?', (scan_id,))
        row = cursor.fetchone()
        if row:
            filename = row[0]
            cursor.execute('DELETE FROM scans WHERE id = ?', (scan_id,))
            conn.commit()
    except Exception as e:
        print(f"Error deleting scan: {e}")
    finally:
        conn.close()
    return filename

def clear_all_scans():
    conn = get_db_connection()
    cursor = conn.cursor()
    filenames = []
    try:
        cursor.execute('SELECT filename FROM scans')
        filenames = [row[0] for row in cursor.fetchall()]
        cursor.execute('DELETE FROM scans')
        conn.commit()
    except Exception as e:
        print(f"Error clearing scans: {e}")
    finally:
        conn.close()
    return filenames

def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    stats = {
        'total_scans': 0,
        'recycling_percentage': 0.0,
        'total_carbon_savings': 0.0,
        'category_distribution': {},
        'daily_scans': []
    }
    try:
        # 1. Total scans, recycled count, carbon savings
        cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_recyclable = 1 THEN 1 ELSE 0 END) as recycled,
                SUM(carbon_savings) as carbon
            FROM scans
        ''')
        row = cursor.fetchone()
        if row and row['total'] > 0:
            stats['total_scans'] = row['total']
            stats['recycling_percentage'] = round((row['recycled'] / row['total']) * 100, 1)
            stats['total_carbon_savings'] = round(row['carbon'] or 0.0, 2)
        
        # 2. Category distribution
        cursor.execute('SELECT category, COUNT(*) as count FROM scans GROUP BY category')
        for row in cursor.fetchall():
            stats['category_distribution'][row['category']] = row['count']
            
        # 3. Daily scan count for the last 7 days
        # Generate last 7 dates in YYYY-MM-DD format
        daily_scans_dict = {}
        for i in range(6, -1, -1):
            date_str = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            daily_scans_dict[date_str] = 0
            
        cursor.execute('''
            SELECT strftime('%Y-%m-%d', scanned_at) as date, COUNT(*) as count 
            FROM scans 
            WHERE scanned_at >= date('now', '-6 days')
            GROUP BY date
        ''')
        for row in cursor.fetchall():
            date = row['date']
            if date in daily_scans_dict:
                daily_scans_dict[date] = row['count']
                
        # Format daily_scans as a list of dicts for chart ingestion
        stats['daily_scans'] = [{'date': d, 'count': c} for d, c in sorted(daily_scans_dict.items())]
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
    finally:
        conn.close()
    return stats

def add_contact_message(name, email, message):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO contact_messages (name, email, message)
            VALUES (?, ?, ?)
        ''', (name, email, message))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error adding contact message: {e}")
        return None
    finally:
        conn.close()

