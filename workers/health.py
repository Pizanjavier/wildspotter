"""Health check script for the worker container.

Connects to the PostgreSQL database and verifies the spots table exists.
"""

import os
import sys

import psycopg2


def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)

    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM spots;")
        count = cur.fetchone()[0]
        cur.close()
        conn.close()
        print(f"ok — spots table has {count} rows")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
