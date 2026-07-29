"""
Rate Limiter Middleware — CrawBot Security
Implements sliding-window Rate Limiting per IP/User to prevent DDoS and LLM API quota exhaustion.
"""
import time
from typing import Dict, List
from fastapi import Request, HTTPException

class RateLimiter:
    def __init__(self, requests_per_minute: int = 15):
        self.rpm = requests_per_minute
        self.window_seconds = 60.0
        self._history: Dict[str, List[float]] = {}

    def is_allowed(self, client_identifier: str) -> bool:
        now = time.time()
        timestamps = self._history.get(client_identifier, [])
        
        # Keep only timestamps within the sliding 60-second window
        valid_timestamps = [ts for ts in timestamps if now - ts < self.window_seconds]
        
        if len(valid_timestamps) >= self.rpm:
            self._history[client_identifier] = valid_timestamps
            return False

        valid_timestamps.append(now)
        self._history[client_identifier] = valid_timestamps
        return True

rate_limiter = RateLimiter(requests_per_minute=15)
