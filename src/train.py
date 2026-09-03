import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor


def main():
    os.makedirs("models", exist_ok=True)

    df = pd.read_csv("data/features.csv")

    X = df.drop("latency_ms", axis=1)
    y = df["latency_ms"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    models = {
        "linear": LinearRegression(),
        "random_forest": RandomForestRegressor(
            n_estimators=100,
            random_state=42
        ),
        "xgboost": XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            random_state=42
        )
    }

    for name, model in models.items():
        model.fit(X_train, y_train)
        joblib.dump(model, f"models/{name}.pkl")
        print(f"Trained: {name}")

    joblib.dump(X_test, "models/X_test.pkl")
    joblib.dump(y_test, "models/y_test.pkl")

    print("Training complete")


if __name__ == "__main__":
    main()