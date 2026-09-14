from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import AnomalyResponse, ClusterResponse, ClusterInfo, ForecastResponse
from sla_anomaly import detect_anomaly
from logs_clustering import get_log_clusters
from forecast import forecast_error_rate
import uvicorn

app = FastAPI(title="IA Service pour Monitoring Microservices")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/ia/anomaly/sla/{service}", response_model=AnomalyResponse)
def anomaly_sla(service: str):
    try:
        is_anomaly, score = detect_anomaly(service)
        return AnomalyResponse(
            service_name=service,
            is_anomaly=is_anomaly,
            score=score,
            details="Anomalie détectée sur le dernier point SLA" if is_anomaly else "Comportement normal"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ia/logs/clusters/{service}", response_model=ClusterResponse)
def logs_clusters(service: str):
    clusters = get_log_clusters(service)
    return ClusterResponse(
        service_name=service,
        clusters=[ClusterInfo(**c) for c in clusters]
    )

@app.get("/api/ia/forecast/sla/{service}", response_model=ForecastResponse)
def forecast_sla(service: str, threshold: float = 5.0):
    predictions, trend, alert = forecast_error_rate(service, threshold)
    return ForecastResponse(
        service_name=service,
        predicted_error_rates=predictions,
        trend=trend,
        alert=alert,
        threshold=threshold
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)