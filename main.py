import sys
import os
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.orchestrator.agent import OrchestratorAgent

if __name__ == "__main__":
    print("====================================")
    print(" STARTING ORCHESTRATOR MVP")
    print("====================================\n")
    
    orchestrator = OrchestratorAgent()
    
    request = {
      "project": "CRM Portal",
      "goal": "Generate documentation, QA tests and demo"
    }

    final_output = orchestrator.run(request)
    
    print("\n--- Final Output ---")
    print(json.dumps(final_output, indent=2))
