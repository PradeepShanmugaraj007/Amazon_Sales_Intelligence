import requests
import io

url = "http://localhost:5000/api/v1/analyze"
csv_content = b"Transaction Type,Invoice Amount,Order Id\nShipment,100,123\nRefund,-20,123\n"

# We must send a token since the endpoint requires authentication.
# Wait, let me check if /api/v1/analyze requires auth in main.py or router.py.
# Usually it does. Let's just check the health endpoint first to make sure syntax is okay.
res = requests.get("http://localhost:5000/health")
print(res.status_code, res.json())
