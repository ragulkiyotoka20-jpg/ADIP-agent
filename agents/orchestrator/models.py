"""Pydantic schemas and models for Orchestration Request, Response, and Metrics."""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class OrchestrationRequest(BaseModel):
    """Payload schema for triggering an agent orchestration run."""

    project_id: str = Field(..., description="Unique project ID or identifier")
    target_url: str = Field(..., description="Base URL of the target application to explore")
    product_name: Optional[str] = Field(default="Application", description="Display name of the software product")
    previous_version: Optional[str] = Field(default=None, description="Previous version ID for Release Intelligence diffing")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional options for agent runs")


class StageMetrics(BaseModel):
    """Execution status and timing for a single pipeline stage."""

    status: str = Field(..., description="PENDING, RUNNING, SUCCESS, FAILED, or SKIPPED")
    duration: Optional[float] = Field(default=None, description="Execution duration in seconds")
    retries: int = Field(default=0, description="Number of retries attempted")
    error: Optional[str] = Field(default=None, description="Error message if stage failed")
    reason: Optional[str] = Field(default=None, description="Reason if stage was skipped")


class ExecutionSummary(BaseModel):
    """Overall execution summary and metrics."""

    overall_status: str = Field(..., description="SUCCESS, PARTIAL_SUCCESS, or FAILED")
    total_duration_seconds: float = Field(..., description="Total execution time in seconds")
    completed_stages: List[str] = Field(default_factory=list, description="List of successfully completed stages")
    failed_stages: List[str] = Field(default_factory=list, description="List of failed stages")
    skipped_stages: List[str] = Field(default_factory=list, description="List of skipped stages")


class OrchestrationResponse(BaseModel):
    """Final aggregated response returned by Orchestrator Agent."""

    request_id: str = Field(..., description="Unique orchestration run ID")
    project_id: str = Field(..., description="Project ID")
    status: str = Field(..., description="Overall execution status")
    summary: ExecutionSummary = Field(..., description="High-level execution metrics")
    context: Dict[str, Any] = Field(..., description="Full aggregated shared execution context data")
