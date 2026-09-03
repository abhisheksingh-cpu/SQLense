import psycopg2
import random

conn = psycopg2.connect(
    dbname="sqlense_db",
    user="postgres",
    password="postgre123",
    host="localhost",
    port="5432"
)

cur = conn.cursor()

cities = ["Kanpur", "Lucknow", "Delhi", "Mumbai"]
genders = ["Male", "Female"]
statuses = ["Completed", "Scheduled", "Cancelled"]

for i in range(100000):
    cur.execute(
        """
        INSERT INTO patients(name, age, gender, city)
        VALUES (%s, %s, %s, %s)
        """,
        (
            f"Patient {i}",
            random.randint(18, 80),
            random.choice(genders),
            random.choice(cities)
        )
    )

for i in range(1000):
    cur.execute(
        """
        INSERT INTO doctors(name, specialization, city)
        VALUES (%s, %s, %s)
        """,
        (
            f"Doctor {i}",
            f"Specialization {i % 10}",
            random.choice(cities)
        )
    )

for i in range(500000):
    cur.execute(
        """
        INSERT INTO appointments
        (patient_id, doctor_id, appointment_date, status)
        VALUES (%s, %s, CURRENT_DATE, %s)
        """,
        (
            random.randint(1, 100000),
            random.randint(1, 1000),
            random.choice(statuses)
        )
    )

conn.commit()

cur.close()
conn.close()

print("Database populated successfully.")