from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    retrieved_context = Column(JSON, nullable=False)
    ground_truth = Column(Text, nullable=True)
    
    faithfulness_score = Column(Float, nullable=True)
    answer_relevancy_score = Column(Float, nullable=True)
    context_precision_score = Column(Float, nullable=True)
    context_recall_score = Column(Float, nullable=True)
    
    retrieval_time = Column(Float, nullable=True)
    generation_time = Column(Float, nullable=True)
    total_time = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    document = relationship("Document", back_populates="evaluations")

class EvaluationBatch(Base):
    __tablename__ = "evaluation_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    model_version = Column(String, nullable=False)
    config_snapshot = Column(JSON, nullable=False)
    
    avg_faithfulness = Column(Float, nullable=True)
    avg_answer_relevancy = Column(Float, nullable=True)
    avg_context_precision = Column(Float, nullable=True)
    avg_context_recall = Column(Float, nullable=True)
    total_evaluations = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
