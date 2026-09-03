import psycopg2
import pandas as pd
import time
import os

from query_generator import generate_queries


DB_CONFIG = {
    "dbname": "sqlense_db",
    "user": "postgres",
    "password": "postgre123",
    "host": "localhost",
    "port": "5432"
}

NUM_QUERIES = 1000


def get_plan(cursor, query):
    cursor.execute("EXPLAIN (FORMAT JSON) " + query)
    return cursor.fetchone()[0][0]


def measure_query(cursor, query):
    start = time.perf_counter()

    cursor.execute(query)
    cursor.fetchall()

    return (time.perf_counter() - start) * 1000


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    queries = generate_queries(NUM_QUERIES)
    data = []

    for item in queries:
        query = item["query"]

        try:
            plan = get_plan(cursor, query)
            latency = measure_query(cursor, query)

            data.append({
                "query_id": item["query_id"],
                "query_type": item["query_type"],
                "query": query,
                "plan": plan,
                "latency_ms": latency
            })

        except Exception as e:
            conn.rollback()
            print("Skipped:", e)

    cursor.close()
    conn.close()

    os.makedirs("data", exist_ok=True)

    df = pd.DataFrame(data)
    df.to_csv("data/dataset.csv", index=False)

    print(f"Collected {len(df)} queries")


if __name__ == "__main__":
    main()