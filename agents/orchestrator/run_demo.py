"""Standalone runnable demonstration script for APIP Agent Orchestrator."""

import asyncio
import json
from agents.orchestrator import OrchestratorAgent, OrchestrationRequest


async def main():
    print("=" * 70)
    print("      APIP AGENT ORCHESTRATOR DEMONSTRATION")
    print("=" * 70)

    # Instantiate Orchestrator Agent
    orchestrator = OrchestratorAgent(max_retries=2, retry_delay=0.5)

    # 1. Example 1: Full Pipeline run WITH previous_version (Triggers Release Intelligence)
    request_v2 = OrchestrationRequest(
        project_id="proj_ecommerce_2026",
        target_url="https://www.wikipedia.org",
        product_name="E-Commerce Platform",
        previous_version="1.0.0",
        options={"capture_network": True}
    )

    print(f"\n[LAUNCH] Launching Orchestration Run for Project: '{request_v2.project_id}'")
    print(f"Target URL: {request_v2.target_url}")
    print(f"Previous Version: {request_v2.previous_version}\n")

    response = await orchestrator.orchestrate(request_v2)

    print("\n" + "=" * 70)
    print("               FINAL AGGREGATED RESPONSE SUMMARY")
    print("=" * 70)
    print(f"Request ID            : {response.request_id}")
    print(f"Project ID            : {response.project_id}")
    print(f"Overall Status        : {response.status}")
    print(f"Total Duration        : {response.summary.total_duration_seconds:.2f} seconds")
    print(f"Completed Stages      : {', '.join(response.summary.completed_stages)}")
    print(f"Failed Stages         : {', '.join(response.summary.failed_stages) if response.summary.failed_stages else 'None'}")
    print(f"Skipped Stages        : {', '.join(response.summary.skipped_stages) if response.summary.skipped_stages else 'None'}")
    print("-" * 70)

    print("\nAGGREGATED OUTPUTS IN SHARED CONTEXT:")
    context = response.context
    print(f"  * Exploration Pages Discovered : {context.get('exploration', {}).get('summary', {}).get('total_pages_discovered', 0)}")
    print(f"  * Knowledge Graph Pages        : {context.get('knowledge_graph', {}).get('pages_count', 0)}")
    print(f"  * Documentation Generated      : {bool(context.get('documentation'))}")
    print(f"  * QA Tests Executed            : {context.get('qa', {}).get('total_test_cases', 0)} (Passed: {context.get('qa', {}).get('passed', 0)})")
    print(f"  * Demo Video Title             : {(context.get('demo') or {}).get('title', 'N/A')}")
    print(f"  * Release Risk Score           : {(context.get('release') or {}).get('risk_assessment', {}).get('risk_score', 'N/A')}")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
