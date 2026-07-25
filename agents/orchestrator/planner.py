class WorkflowPlanner:
    def create_plan(self, request_type: str) -> list:
        """
        Creates the execution plan based on the routed request type.
        """
        base_plan = ["explorer", "knowledge_graph"]
        if request_type == "qa":
            return base_plan + ["qa"]
        elif request_type == "documentation":
            return base_plan + ["documentation"]
        elif request_type == "demo":
            return base_plan + ["demo"]
        
        # Default full suite
        return base_plan + ["documentation", "qa", "demo"]
