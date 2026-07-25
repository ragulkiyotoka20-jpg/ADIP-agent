class DummyAgent:
    """Mock agent for Hackathon MVP purposes"""
    def __init__(self, name):
        self.name = name
        
    def run(self, context):
        print(f"  [{self.name}] Running logic... ")
        return {f"{self.name.lower()}_output": "completed data"}

class AgentRegistry:
    """
    Keeps track of all available agents.
    """
    def __init__(self):
        self.agents = {
            "explorer": DummyAgent("Explorer"),
            "knowledge_graph": DummyAgent("Knowledge_Graph"),
            "documentation": DummyAgent("Documentation"),
            "qa": DummyAgent("QA"),
            "demo": DummyAgent("Demo")
        }
    
    def get(self, agent_name: str):
        return self.agents.get(agent_name)
