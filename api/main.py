from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.explain import predict_latency


app = FastAPI(title="SQLense API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str


@app.get("/")
def home():
    return {"message": "SQLense API is running"}


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