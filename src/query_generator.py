import random

cities = ["Kanpur", "Lucknow", "Delhi", "Mumbai"]
statuses = ["Completed", "Scheduled", "Cancelled"]


def generate_queries(n=1000):
    queries = []

    for i in range(n):
        q = random.randint(1, 5)

        if q == 1:
            query = f"""
            SELECT *
            FROM patients
            WHERE age > {random.randint(18, 70)};
            """

        elif q == 2:
            query = f"""
            SELECT *
            FROM patients
            WHERE city = '{random.choice(cities)}';
            """

        elif q == 3:
            query = """
            SELECT city, COUNT(*)
            FROM patients
            GROUP BY city;
            """

        elif q == 4:
            query = """
            SELECT p.name, a.appointment_date
            FROM patients p
            JOIN appointments a
            ON p.patient_id = a.patient_id;
            """

        else:
            query = f"""
            SELECT p.city, COUNT(a.appointment_id)
            FROM patients p
            JOIN appointments a
            ON p.patient_id = a.patient_id
            WHERE p.city = '{random.choice(cities)}'
            GROUP BY p.city;
            """

        queries.append({
            "query_id": f"Q{i + 1}",
            "query_type": q,
            "query": query.strip()
        })

    return queries


if __name__ == "__main__":
    queries = generate_queries()

    print("Generated:", len(queries))
    print(queries[0])