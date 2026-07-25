"""Master Orchestrator Agent for Autonomous Product Intelligence Platform (APIP).

Combines Registry, Execution Planner, and Shared Execution Context to run complete end-to-end
agent pipelines and return aggregated execution summaries.
"""

import uuid
import logging
from typing import Dict, Any, Optional

from agents.orchestrator.context import ExecutionContext
from agents.orchestrator.registry import AgentRegistry
from agents.orchestrator.execution_plan import ExecutionPlanner
from agents.orchestrator.models import (
    OrchestrationRequest,
    OrchestrationResponse,
    ExecutionSummary,
)

logger = logging.getLogger("orchestrator.master")


class OrchestratorAgent:
    """Master Orchestrator Agent connecting all APIP platform agents."""

    def __init__(
        self,
        registry: Optional[AgentRegistry] = None,
        max_retries: int = 3,
        retry_delay: float = 1.0,
    ) -> None:
        self.registry = registry or AgentRegistry()
        self.planner = ExecutionPlanner(
            registry=self.registry,
            max_retries=max_retries,
            retry_delay=retry_delay,
        )

    async def run(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute orchestration workflow given raw project dictionary."""
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        logger.info(f"Initiating OrchestratorAgent run [{request_id}] for project: {project_data.get('project_id')}")

        context = ExecutionContext(project=project_data)
        final_context = await self.planner.run_pipeline(context)
        return final_context.to_dict()

    async def orchestrate(self, request: OrchestrationRequest) -> OrchestrationResponse:
        """Execute orchestration workflow given Pydantic OrchestrationRequest model."""
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        logger.info(f"Processing OrchestrationRequest [{request_id}] for project: {request.project_id}")

        project_dict = {
            "project_id": request.project_id,
            "target_url": request.target_url,
            "product_name": request.product_name or "Application",
            "previous_version": request.previous_version,
            "version": "2.0.0" if request.previous_version else "1.0.0",
            "options": request.options or {},
        }

        context = ExecutionContext(project=project_dict)
        final_context = await self.planner.run_pipeline(context)

        # Build ExecutionSummary
        status_info = final_context.status
        stages_info = status_info.get("stages", {})

        completed_stages = [s for s, data in stages_info.items() if data.get("status") == "SUCCESS"]
        failed_stages = [s for s, data in stages_info.items() if data.get("status") == "FAILED"]
        skipped_stages = [s for s, data in stages_info.items() if data.get("status") == "SKIPPED"]

        summary = ExecutionSummary(
            overall_status=status_info.get("overall", "UNKNOWN"),
            total_duration_seconds=status_info.get("total_duration", 0.0),
            completed_stages=completed_stages,
            failed_stages=failed_stages,
            skipped_stages=skipped_stages,
        )

        return OrchestrationResponse(
            request_id=request_id,
            project_id=request.project_id,
            status=status_info.get("overall", "UNKNOWN"),
            summary=summary,
            context=final_context.to_dict(),
        )
