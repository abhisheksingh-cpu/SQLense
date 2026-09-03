import psycopg2
import joblib
import pandas as pd

from src.features import extract_features


import os

from dotenv import load_dotenv

load_dotenv()


DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}


def get_plan(cursor, query):
    cursor.execute("EXPLAIN (FORMAT JSON) " + query)
    return cursor.fetchone()[0][0]


def predict_latency(query):
    connection = psycopg2.connect(**DB_CONFIG)
    cursor = connection.cursor()

    plan = get_plan(cursor, query)

    features = extract_features(plan, query)

    model = joblib.load("models/linear.pkl")

    values = pd.DataFrame([features])

    prediction = model.predict(values)[0]

    cursor.close()
    connection.close()

    return prediction


if __name__ == "__main__":

    print("SQLense - SQL Query Performance Predictor")
    print("=" * 50)

    query = input("\nEnter SQL query: ")

    try:
        latency = predict_latency(query)

        print("\nPredicted Latency:",
              round(latency, 2), "ms")

    except Exception as e:
        print("\nError:", e)