"""Execution Plan and Pipeline DAG Orchestrator for APIP.

Manages sequential dependency stages, parallel concurrent execution via asyncio.gather(),
automatic retry policies, and graceful failure handling.
"""

import time
import asyncio
import logging
from typing import Dict, Any, List, Optional

from agents.orchestrator.context import ExecutionContext
from agents.orchestrator.registry import AgentRegistry, BaseAgent

logger = logging.getLogger("orchestrator.execution_plan")


class ExecutionPlanner:
    """Orchestrates agent dependency DAG execution pipeline."""

    def __init__(self, registry: AgentRegistry, max_retries: int = 3, retry_delay: float = 1.0) -> None:
        self.registry = registry
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    async def execute_agent_with_retry(
        self,
        agent_id: str,
        context: ExecutionContext,
    ) -> Optional[Dict[str, Any]]:
        """Execute a single agent with retry logic, error handling, and status logging."""
        agent = self.registry.get_agent(agent_id)
        context.record_stage_start(agent_id)
        
        start_time = time.time()
        retries = 0
        last_exception: Optional[Exception] = None

        while retries < self.max_retries:
            try:
                logger.info(f"[{agent_id.upper()}] Starting execution (Attempt {retries + 1}/{self.max_retries})...")
                result = await agent.run(context.to_dict())
                duration = time.time() - start_time
                
                context.record_stage_success(agent_id, duration=duration, retries=retries)
                logger.info(f"[{agent_id.upper()}] Succeeded in {duration:.2f}s (Attempt {retries + 1}).")
                return result
            except Exception as e:
                retries += 1
                last_exception = e
                logger.warning(f"[{agent_id.upper()}] Execution attempt {retries} failed: {e}")
                if retries < self.max_retries:
                    await asyncio.sleep(self.retry_delay * retries)

        duration = time.time() - start_time
        error_msg = f"Failed after {self.max_retries} attempts: {last_exception}"
        context.record_stage_failure(agent_id, error_msg=error_msg, duration=duration, retries=retries)
        logger.error(f"[{agent_id.upper()}] Permanent failure: {error_msg}")
        return None

    async def run_pipeline(self, context: ExecutionContext) -> ExecutionContext:
        """Execute full orchestration workflow following dependency DAG.
        
        Dependency Flow:
            Stage 1: Explorer Agent (Sequential)
                    ↓
            Stage 2: Knowledge Graph Agent (Sequential)
                    ↓
            Stage 3: Concurrent Parallel Execution (asyncio.gather):
                     • Documentation Agent
                     • QA Agent
                     • Demo Agent
                    ↓
            Stage 4: Release Intelligence Agent (Conditional - if previous_version exists)
                    ↓
            Stage 5: Final Aggregation & Summary
        """
        logger.info("=== Starting APIP Agent Orchestration Pipeline ===")
        
        # ---------------------------------------------------------------------
        # STAGE 1: Explorer Agent
        # ---------------------------------------------------------------------
        logger.info("--- Stage 1: Explorer Agent ---")
        exp_result = await self.execute_agent_with_retry("explorer", context)
        if exp_result:
            context["exploration"] = exp_result
        else:
            logger.warning("[STAGE 1] Explorer Agent failed. Proceeding with empty exploration payload.")
            context["exploration"] = {"pages": [], "elements": [], "forms": [], "workflows": []}

        # ---------------------------------------------------------------------
        # STAGE 2: Knowledge Graph Agent
        # ---------------------------------------------------------------------
        logger.info("--- Stage 2: Knowledge Graph Agent ---")
        kg_result = await self.execute_agent_with_retry("knowledge", context)
        if kg_result:
            context["knowledge_graph"] = kg_result
        else:
            logger.warning("[STAGE 2] Knowledge Graph Agent failed. Creating fallback graph context.")
            context["knowledge_graph"] = {"version_id": "1.0.0", "pages_count": 0, "pages": []}

        # ---------------------------------------------------------------------
        # STAGE 3: Concurrent Parallel Execution (Documentation, QA, Demo)
        # ---------------------------------------------------------------------
        logger.info("--- Stage 3: Parallel Execution (Documentation, QA, Demo) ---")
        
        async def run_parallel_stage(stage_name: str) -> tuple[str, Optional[Dict[str, Any]]]:
            res = await self.execute_agent_with_retry(stage_name, context)
            return stage_name, res

        # Run Documentation, QA, and Demo concurrently using asyncio.gather()
        parallel_results = await asyncio.gather(
            run_parallel_stage("documentation"),
            run_parallel_stage("qa"),
            run_parallel_stage("demo"),
            return_exceptions=True
        )

        for item in parallel_results:
            if isinstance(item, Exception):
                logger.error(f"[STAGE 3] Exception during parallel execution: {item}")
                continue
            
            stage_name, res = item
            if res:
                context[stage_name] = res
            else:
                logger.warning(f"[STAGE 3] Agent '{stage_name}' failed during parallel execution.")

        # ---------------------------------------------------------------------
        # STAGE 4: Release Intelligence Agent (Conditional)
        # ---------------------------------------------------------------------
        logger.info("--- Stage 4: Release Intelligence Agent ---")
        project_data = context.get("project", {})
        has_previous_version = bool(project_data.get("previous_version"))

        if has_previous_version:
            rel_result = await self.execute_agent_with_retry("release", context)
            if rel_result:
                context["release"] = rel_result
        else:
            logger.info("[STAGE 4] No previous_version specified. Skipping Release Intelligence stage.")
            context.record_stage_skipped("release", reason="No previous_version provided in project context")

        # ---------------------------------------------------------------------
        # STAGE 5: Final Aggregation & Summary
        # ---------------------------------------------------------------------
        logger.info("--- Stage 5: Finalizing Context & Aggregating Outputs ---")
        context.finalize()
        logger.info(f"=== Pipeline Finished with Status: {context.status['overall']} in {context.status['total_duration']}s ===")
        return context
