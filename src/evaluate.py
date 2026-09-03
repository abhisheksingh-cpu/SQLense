import pandas as pd
import joblib

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def main():
    df = pd.read_csv("data/features.csv")

    X = df.drop("latency_ms", axis=1)
    y = df["latency_ms"]

    X_test = joblib.load("models/X_test.pkl")
    y_test = joblib.load("models/y_test.pkl")

    models = {
        "Linear Regression": joblib.load("models/linear.pkl"),
        "Random Forest": joblib.load("models/random_forest.pkl"),
        "XGBoost": joblib.load("models/xgboost.pkl")
    }

    results = []

    for name, model in models.items():
        predictions = model.predict(X_test)

        mae = mean_absolute_error(y_test, predictions)
        rmse = mean_squared_error(y_test, predictions) ** 0.5
        r2 = r2_score(y_test, predictions)

        results.append([name, mae, rmse, r2])

    results = pd.DataFrame(
        results,
        columns=["Model", "MAE", "RMSE", "R2"]
    )

    print("\nSQLense Model Comparison")
    print("=" * 60)
    print(results.to_string(index=False))

    best = results.loc[results["MAE"].idxmin()]

    print("\nBest Model:", best["Model"])
    print("MAE:", round(best["MAE"], 4))


if __name__ == "__main__":
    main()