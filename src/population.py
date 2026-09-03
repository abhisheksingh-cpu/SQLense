import os
import random
import psycopg2
from psycopg2.extras import execute_values

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


# --------------------------------------------------
# Patients
# --------------------------------------------------

print("Generating patients...")

patients = [
    (
        f"Patient {i}",
        random.randint(18, 80),
        random.choice(genders),
        random.choice(cities)
    )
    for i in range(100000)
]

print("Inserting patients...")

execute_values(
    cur,
    """
    INSERT INTO patients(name, age, gender, city)
    VALUES %s
    """,
    patients,
    page_size=1000
)

conn.commit()

print("Patients inserted:", len(patients))


# --------------------------------------------------
# Doctors
# --------------------------------------------------

print("Generating doctors...")

doctors = [
    (
        f"Doctor {i}",
        f"Specialization {i % 10}",
        random.choice(cities)
    )
    for i in range(1000)
]

print("Inserting doctors...")

execute_values(
    cur,
    """
    INSERT INTO doctors(name, specialization, city)
    VALUES %s
    """,
    doctors,
    page_size=500
)

conn.commit()

print("Doctors inserted:", len(doctors))


# --------------------------------------------------
# Appointments
# --------------------------------------------------

print("Generating appointments...")

appointments = [
    (
        random.randint(1, 100000),
        random.randint(1, 1000),
        "2026-09-03",
        random.choice(statuses)
    )
    for _ in range(500000)
]

print("Inserting appointments...")

execute_values(
    cur,
    """
    INSERT INTO appointments
    (patient_id, doctor_id, appointment_date, status)
    VALUES %s
    """,
    appointments,
    page_size=1000
)

conn.commit()

print("Appointments inserted:", len(appointments))


cur.close()
conn.close()

print("Database populated successfully.")