import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sqlalchemy import text
from database import SessionLocal
import logging

logger = logging.getLogger(__name__)

def detect_anomaly(service_name: str):
    """
    Récupère les 100 derniers points SLA pour le service,
    entraîne un IsolationForest et prédit sur le dernier point.
    Retourne (is_anomaly: bool, score: float)
    """
    db = SessionLocal()
    try:
        # Récupérer les points SLA (error_rate et avg_response_time_ms)
        query = text("""
            SELECT error_rate, avg_response_time_ms
            FROM sla_records
            WHERE service_name = :service
            ORDER BY timestamp DESC
            LIMIT 100
        """)
        result = db.execute(query, {"service": service_name})
        rows = result.fetchall()
        if len(rows) < 10:
            return False, 0.0  # Pas assez de données

        df = pd.DataFrame(rows, columns=["error_rate", "avg_response_time_ms"])
        # Normaliser
        scaler = StandardScaler()
        data_scaled = scaler.fit_transform(df[["error_rate", "avg_response_time_ms"]])

        # Isolation Forest
        model = IsolationForest(contamination=0.1, random_state=42)
        model.fit(data_scaled)

        # Prédire sur le dernier point
        last_point = data_scaled[-1].reshape(1, -1)
        pred = model.predict(last_point)
        anomaly = pred[0] == -1

        # Score de décision (moyenne des décisions sur tous les points)
        decisions = model.decision_function(data_scaled)
        avg_decision = float(np.mean(decisions))

        return anomaly, avg_decision
    except Exception as e:
        logger.error(f"Erreur détection anomalie: {e}")
        return False, 0.0
    finally:
        db.close()