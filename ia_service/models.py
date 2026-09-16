from pydantic import BaseModel
from typing import List, Optional

class AnomalyResponse(BaseModel):
    service_name: str
    is_anomaly: bool
    score: float
    details: Optional[str] = None

class ClusterInfo(BaseModel):
    cluster_id: int
    keywords: List[str]
    count: int
    sample_message: str

class ClusterResponse(BaseModel):
    service_name: str
    clusters: List[ClusterInfo]

class ForecastResponse(BaseModel):
    service_name: str
    predicted_error_rates: List[float]
    trend: str  # "up" or "down"
    alert: bool
    threshold: float