from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class APIResponse(BaseModel):
    status: str
    message: str
