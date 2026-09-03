import ast
import pandas as pd


def extract_features(plan, query):
    root = plan["Plan"]

    query = query.lower()

    return {
        "total_cost": root["Total Cost"],
        "estimated_rows": root["Plan Rows"],
        "plan_width": root["Plan Width"],
        "has_where": int("where" in query),
        "has_join": int("join" in query),
        "has_group_by": int("group by" in query),
        "has_order_by": int("order by" in query),
        "has_aggregate": int(
            any(x in query for x in ["count(", "sum(", "avg(", "min(", "max("])
        )
    }


def main():
    df = pd.read_csv("data/dataset.csv")

    plans = df["plan"].apply(ast.literal_eval)

    features = []

    for plan, query in zip(plans, df["query"]):
        features.append(extract_features(plan, query))

    features = pd.DataFrame(features)
    features["latency_ms"] = df["latency_ms"]

    features.to_csv("data/features.csv", index=False)

    print("Features created:", len(features))
    print("Feature columns:", list(features.columns))


if __name__ == "__main__":
    main()