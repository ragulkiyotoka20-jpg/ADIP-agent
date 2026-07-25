"""Shared Execution Context for Autonomous Product Intelligence Platform (APIP).

Provides unified state management, execution tracking, and dictionary-compatible access
between pipeline agents.
"""

import time
from typing import Dict, Any, List, Optional, MutableMapping


class ExecutionContext(MutableMapping):
    """Shared execution context object passed through the agent orchestration pipeline.
    
    Implements MutableMapping to support standard dict access (e.g. context['exploration'])
    as well as attribute access (e.g. context.exploration).
    """

    def __init__(
        self,
        project: Optional[Dict[str, Any]] = None,
        exploration: Optional[Dict[str, Any]] = None,
        knowledge_graph: Optional[Dict[str, Any]] = None,
        documentation: Optional[Dict[str, Any]] = None,
        qa: Optional[Dict[str, Any]] = None,
        demo: Optional[Dict[str, Any]] = None,
        release: Optional[Dict[str, Any]] = None,
        errors: Optional[List[Dict[str, Any]]] = None,
        status: Optional[Dict[str, Any]] = None,
    ):
        self._store: Dict[str, Any] = {
            "project": project or {},
            "exploration": exploration,
            "knowledge_graph": knowledge_graph,
            "documentation": documentation,
            "qa": qa,
            "demo": demo,
            "release": release,
            "errors": errors if errors is not None else [],
            "status": status or {
                "overall": "PENDING",
                "start_time": time.time(),
                "end_time": None,
                "total_duration": None,
                "stages": {},
            },
        }

    # Dict-like MutableMapping implementation
    def __getitem__(self, key: str) -> Any:
        return self._store[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self._store[key] = value

    def __delitem__(self, key: str) -> None:
        del self._store[key]

    def __iter__(self):
        return iter(self._store)

    def __len__(self) -> int:
        return len(self._store)

    def get(self, key: str, default: Any = None) -> Any:
        """Safe dict getter."""
        return self._store.get(key, default)

    # Attribute access convenience
    def __getattr__(self, name: str) -> Any:
        if name.startswith("_"):
            raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
        if name in self._store:
            return self._store[name]
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

    def __setattr__(self, name: str, value: Any) -> None:
        if name.startswith("_"):
            super().__setattr__(name, value)
        elif hasattr(self, "_store") and name in self._store:
            self._store[name] = value
        else:
            super().__setattr__(name, value)

    # Explicit accessors
    @property
    def project(self) -> Dict[str, Any]:
        return self._store["project"]

    @property
    def exploration(self) -> Optional[Dict[str, Any]]:
        return self._store["exploration"]

    @property
    def knowledge_graph(self) -> Optional[Dict[str, Any]]:
        return self._store["knowledge_graph"]

    @property
    def documentation(self) -> Optional[Dict[str, Any]]:
        return self._store["documentation"]

    @property
    def qa(self) -> Optional[Dict[str, Any]]:
        return self._store["qa"]

    @property
    def demo(self) -> Optional[Dict[str, Any]]:
        return self._store["demo"]

    @property
    def release(self) -> Optional[Dict[str, Any]]:
        return self._store["release"]

    @property
    def errors(self) -> List[Dict[str, Any]]:
        return self._store["errors"]

    @property
    def status(self) -> Dict[str, Any]:
        return self._store["status"]

    # Timing & Status Methods
    def record_stage_start(self, stage_name: str) -> None:
        """Mark start of a stage in status dictionary."""
        self._store["status"]["stages"][stage_name] = {
            "status": "RUNNING",
            "start_time": time.time(),
            "end_time": None,
            "duration": None,
            "retries": 0,
            "error": None,
        }

    def record_stage_success(self, stage_name: str, duration: float, retries: int = 0) -> None:
        """Record successful stage completion."""
        stage_info = self._store["status"]["stages"].get(stage_name, {})
        stage_info.update({
            "status": "SUCCESS",
            "end_time": time.time(),
            "duration": round(duration, 3),
            "retries": retries,
            "error": None,
        })
        self._store["status"]["stages"][stage_name] = stage_info

    def record_stage_failure(self, stage_name: str, error_msg: str, duration: float, retries: int = 0) -> None:
        """Record stage failure and append to global errors list."""
        stage_info = self._store["status"]["stages"].get(stage_name, {})
        stage_info.update({
            "status": "FAILED",
            "end_time": time.time(),
            "duration": round(duration, 3),
            "retries": retries,
            "error": error_msg,
        })
        self._store["status"]["stages"][stage_name] = stage_info
        self._store["errors"].append({
            "stage": stage_name,
            "error": error_msg,
            "timestamp": time.time(),
        })

    def record_stage_skipped(self, stage_name: str, reason: str) -> None:
        """Record skipped stage in status dictionary."""
        self._store["status"]["stages"][stage_name] = {
            "status": "SKIPPED",
            "start_time": None,
            "end_time": None,
            "duration": 0.0,
            "retries": 0,
            "reason": reason,
        }

    def finalize(self) -> None:
        """Calculate total execution time and finalize overall status."""
        end_time = time.time()
        start_time = self._store["status"].get("start_time", end_time)
        duration = round(end_time - start_time, 3)

        stages = self._store["status"].get("stages", {})
        failed_count = sum(1 for s in stages.values() if s.get("status") == "FAILED")
        success_count = sum(1 for s in stages.values() if s.get("status") == "SUCCESS")

        if failed_count == 0:
            overall = "SUCCESS"
        elif success_count > 0:
            overall = "PARTIAL_SUCCESS"
        else:
            overall = "FAILED"

        self._store["status"]["overall"] = overall
        self._store["status"]["end_time"] = end_time
        self._store["status"]["total_duration"] = duration

    def to_dict(self) -> Dict[str, Any]:
        """Export as plain dictionary."""
        return dict(self._store)
