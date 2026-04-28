import urllib.request, json
req = urllib.request.Request(
    'http://127.0.0.1:5000/api/auth/login', 
    data=json.dumps({'email': 'aajay1118@gmail.com', 'password': 'Demo@1234'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)
try:
    res = urllib.request.urlopen(req)
    print("SUCCESS", res.read().decode('utf-8'))
except Exception as e:
    print("ERROR", e.code, e.read().decode('utf-8'))
