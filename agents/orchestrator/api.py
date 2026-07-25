"""FastAPI REST Web Service exposing Agent Orchestration endpoints."""

import sys
import logging
from pathlib import Path

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from agents.orchestrator.orchestrator import OrchestratorAgent
from agents.orchestrator.models import OrchestrationRequest, OrchestrationResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orchestrator.api")

app = FastAPI(
    title="APIP Orchestrator API",
    description="REST API for Autonomous Product Intelligence Platform Agent Orchestration",
    version="1.0.0",
)

# Enable CORS for frontend web apps / dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = OrchestratorAgent()


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint for checking API status and registered agents."""
    return {
        "status": "HEALTHY",
        "service": "APIP Orchestrator",
        "registered_agents": orchestrator.registry.list_agents(),
    }


@app.post(
    "/api/v1/orchestrate",
    response_model=OrchestrationResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Agent Orchestration Pipeline",
)
async def trigger_orchestration(request: OrchestrationRequest):
    """Trigger complete end-to-end agent orchestration workflow.
    
    Order of Execution:
    1. Explorer Agent (Crawls target URL)
    2. Knowledge Graph Agent (Builds product knowledge graph)
    3. Concurrent Parallel Execution:
       • Documentation Agent (User guide, FAQs)
       • QA Agent (Test suites, edge cases)
       • Demo Agent (Walkthrough storyboard & video)
    4. Release Intelligence Agent (Conditional diffing if previous_version exists)
    5. Output Aggregation
    """
    try:
        logger.info(f"Received orchestration request for project '{request.project_id}' ({request.target_url})")
        response = await orchestrator.orchestrate(request)
        return response
    except Exception as e:
        logger.error(f"Orchestration endpoint failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Orchestration workflow failed: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agents.orchestrator.api:app", host="0.0.0.0", port=8000, reload=True)
