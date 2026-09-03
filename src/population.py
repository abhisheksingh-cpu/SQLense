import os
import random
import psycopg2

from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)

cur = conn.cursor()

cities = ["Kanpur", "Lucknow", "Delhi", "Mumbai"]
genders = ["Male", "Female"]
statuses = ["Completed", "Scheduled", "Cancelled"]


# -----------------------------
# Patients
# -----------------------------

patients = [
    (
        f"Patient {i}",
        random.randint(18, 80),
        random.choice(genders),
        random.choice(cities)
    )
    for i in range(100000)
]

cur.executemany(
    """
    INSERT INTO patients(name, age, gender, city)
    VALUES (%s, %s, %s, %s)
    """,
    patients
)

print("Patients inserted:", len(patients))


# -----------------------------
# Doctors
# -----------------------------

doctors = [
    (
        f"Doctor {i}",
        f"Specialization {i % 10}",
        random.choice(cities)
    )
    for i in range(1000)
]

cur.executemany(
    """
    INSERT INTO doctors(name, specialization, city)
    VALUES (%s, %s, %s)
    """,
    doctors
)

print("Doctors inserted:", len(doctors))


# -----------------------------
# Appointments
# -----------------------------

appointments = [
    (
        random.randint(1, 100000),
        random.randint(1, 1000),
        "Completed"  # temporary status
    )
    for _ in range(500000)
]

# Randomize statuses separately
appointments = [
    (patient_id, doctor_id, random.choice(statuses))
    for patient_id, doctor_id, _ in appointments
]

cur.executemany(
    """
    INSERT INTO appointments
    (patient_id, doctor_id, appointment_date, status)
    VALUES (%s, %s, CURRENT_DATE, %s)
    """,
    appointments
)

print("Appointments inserted:", len(appointments))


conn.commit()

cur.close()
conn.close()

print("Database populated successfully.")