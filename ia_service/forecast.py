import numpy as np
from sklearn.linear_model import LinearRegression
from sqlalchemy import text
from database import SessionLocal
import logging

logger = logging.getLogger(__name__)

def forecast_error_rate(service_name: str, threshold: float = 5.0):
    """
    Utilise une régression linéaire sur les 12 derniers points d'error_rate
    pour prédire les 2 prochains points.
    Retourne (predicted_values: list, trend: str, alert: bool)
    """
    db = SessionLocal()
    try:
        query = text("""
            SELECT error_rate
            FROM sla_records
            WHERE service_name = :service
            ORDER BY timestamp DESC
            LIMIT 12
        """)
        result = db.execute(query, {"service": service_name})
        rows = result.fetchall()
        if len(rows) < 6:
            return [], "stable", False

        # Les valeurs sont triées du plus récent au plus ancien, on les inverse pour avoir ordre croissant
        y = np.array([row[0] for row in rows[::-1]]).reshape(-1, 1)
        X = np.arange(len(y)).reshape(-1, 1)

        model = LinearRegression()
        model.fit(X, y)

        # Prédire les 2 prochains points
        future_X = np.array([[len(y)], [len(y)+1]])
        predictions = model.predict(future_X).flatten().tolist()

        # Déterminer la tendance (pente)
        slope = model.coef_[0][0]
        trend = "up" if slope > 0.05 else "down" if slope < -0.05 else "stable"

        # Vérifier si la prédiction dépasse le seuil
        alert = max(predictions) > threshold

        return predictions, trend, alert
    except Exception as e:
        logger.error(f"Erreur forecast: {e}")
        return [], "stable", False
    finally:
        db.close()