import requests
import os
import urllib3
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

PA_HOST = os.getenv("PA_HOST")
PA_API_KEY = os.getenv("PA_API_KEY")

# Sprawdź surową odpowiedź API
response = requests.get(
    f"{PA_HOST}/api/",
    params={
        "type": "log",
        "log-type": "traffic",
        "key": PA_API_KEY,
        "nlogs": 10,
    },
    verify=False
)

print("Status:", response.status_code)
print("Odpowiedź:")
print(response.text[:2000])
