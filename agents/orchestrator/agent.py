from .router import RequestRouter
from .planner import WorkflowPlanner
from .registry import AgentRegistry
from .context import ContextManager
from .errors import ErrorHandler
from .aggregator import ResultAggregator

class OrchestratorAgent:
    """
    Primary orchestration agent implementing the Hackathon MVP workflow.
    """
    def __init__(self):
        self.router = RequestRouter()
        self.planner = WorkflowPlanner()
        self.registry = AgentRegistry()
        self.context_manager = ContextManager()
        self.error_handler = ErrorHandler()
        self.aggregator = ResultAggregator()
        
    def run(self, request: dict):
        print(f"-> Received Request: {request.get('goal', 'Unknown')}")
        
        # 1. Route Request
        req_type = self.router.route_request(request.get("goal", ""))
        
        # 2. Plan Workflow
        plan = self.planner.create_plan(req_type)
        print(f"-> Execution Plan: {' -> '.join(plan)}")
        
        # 3. Execute Workflow through Context Manager
        for step in plan:
            try:
                agent = self.registry.get(step)
                if not agent:
                    raise ValueError(f"Agent '{step}' not found in registry")
                    
                step_result = agent.run(self.context_manager.get_context())
                self.context_manager.update(step, step_result)
                
            except Exception as e:
                should_continue = self.error_handler.handle(e, step)
                if not should_continue:
                    return {"status": "Failed", "error": str(e)}
                    
        # 4. Aggregate Results
        final_response = self.aggregator.combine(self.context_manager.get_context())
        return final_response
