import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT')
)
cur = conn.cursor()
cur.execute("UPDATE spots SET status = 'terrain_done', legal_status = NULL WHERE status IN ('legal_done', 'ai_done', 'context_done', 'amenities_done', 'completed');")
print(f'Rows updated: {cur.rowcount}')
conn.commit()
cur.close()
conn.close()
