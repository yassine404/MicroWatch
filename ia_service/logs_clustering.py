import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from elasticsearch import Elasticsearch
from database import es_client, Config
import logging

logger = logging.getLogger(__name__)

def clean_message(msg: str) -> str:
    # Supprimer les dates, IDs, chiffres, etc.
    msg = re.sub(r'\d+', '', msg)
    msg = re.sub(r'[^a-zA-Z]', ' ', msg)
    return msg.lower().strip()

def get_log_clusters(service_name: str, hours: int = 24):
    """
    Récupère les logs ERROR des dernières `hours` heures pour le service,
    les vectorise avec TF-IDF et applique K-Means (k=5).
    Retourne une liste de clusters avec mots-clés, compte, exemple.
    """
    query = {
        "query": {
            "bool": {
                "must": [
                    {"match_phrase": {"container.name": service_name}},
                    {"match_phrase": {"level": "ERROR"}},
                    {"range": {"@timestamp": {"gte": f"now-{hours}h"}}}
                ]
            }
        },
        "size": 1000,
        "_source": ["message"]
    }
    try:
        response = es_client.search(index=Config.ELASTICSEARCH_INDEX_LOGS, body=query)
        hits = response['hits']['hits']
        if not hits:
            return []

        messages = [hit['_source'].get('message', '') for hit in hits if hit['_source'].get('message')]
        # Nettoyer
        cleaned = [clean_message(msg) for msg in messages if len(msg) > 10]

        if len(cleaned) < 5:
            return []  # Pas assez de logs

        # TF-IDF
        vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        X = vectorizer.fit_transform(cleaned)

        # K-Means
        n_clusters = min(5, len(cleaned))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)

        clusters = {}
        for idx, label in enumerate(labels):
            clusters.setdefault(label, []).append(cleaned[idx])

        # Extraire les mots les plus fréquents par cluster
        feature_names = vectorizer.get_feature_names_out()
        result_clusters = []
        for label, msgs in clusters.items():
            # Moyenne des TF-IDF pour ce cluster pour trouver les mots importants
            cluster_vectors = X[labels == label]
            centroid = cluster_vectors.mean(axis=0).A1
            top_indices = centroid.argsort()[-5:][::-1]
            top_words = [feature_names[i] for i in top_indices]

            result_clusters.append({
                "cluster_id": int(label),
                "keywords": top_words,
                "count": len(msgs),
                "sample_message": msgs[0][:150] + "..." if len(msgs[0]) > 150 else msgs[0]
            })

        return result_clusters
    except Exception as e:
        logger.error(f"Erreur clustering logs: {e}")
        return []