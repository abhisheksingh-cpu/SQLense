from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.explain import predict_latency


app = FastAPI(title="SQLense API")


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Request model
# --------------------------------------------------

class QueryRequest(BaseModel):
    query: str


# --------------------------------------------------
# Home
# --------------------------------------------------

@app.get("/")
def home():
    return {"message": "SQLense API is running"}


# --------------------------------------------------
# Predict latency
# --------------------------------------------------

@app.post("/predict")
def predict(request: QueryRequest):

    if not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail="SQL query cannot be empty"
        )

    try:
        latency = predict_latency(request.query)

        return {
            "query": request.query,
            "predicted_latency_ms": round(latency, 2)
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )