from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine("sqlite:///analyses.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class AnalysisRecord(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    logs_count = Column(Integer)
    time_range = Column(String)
    report = Column(Text)


Base.metadata.create_all(bind=engine)


def save_analysis(logs_count, time_range, report_text):
    db = SessionLocal()
    record = AnalysisRecord(
        logs_count=logs_count,
        time_range=time_range,
        report=report_text
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    db.close()
    return record.id


def get_all_analyses():
    db = SessionLocal()
    records = db.query(AnalysisRecord).order_by(AnalysisRecord.timestamp.desc()).all()
    db.close()
    return records


def get_analysis_by_id(analysis_id):
    db = SessionLocal()
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    db.close()
    return record
