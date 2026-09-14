from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from elasticsearch import Elasticsearch
from config import Config

# PostgreSQL
DATABASE_URL = f"postgresql://{Config.POSTGRES_USER}:{Config.POSTGRES_PASSWORD}@{Config.POSTGRES_HOST}:{Config.POSTGRES_PORT}/{Config.POSTGRES_DB}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Elasticsearch
es_client = Elasticsearch(
    [{"host": Config.ELASTICSEARCH_HOST, "port":int(Config.ELASTICSEARCH_PORT), "scheme": "http"}],
    request_timeout=30
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()