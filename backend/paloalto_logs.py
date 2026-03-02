import requests
import os
import urllib3
import xml.etree.ElementTree as ET
import time
from collections import Counter
from datetime import datetime, timedelta
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

PA_HOST = os.getenv("PA_HOST")
PA_API_KEY = os.getenv("PA_API_KEY")


def get_traffic_logs(max_logs=5000, hours=24):
    url = f"{PA_HOST}/api/"

    time_from = (datetime.now() - timedelta(hours=hours)).strftime("%Y/%m/%d %H:%M:%S")

    params = {
        "type": "log",
        "log-type": "traffic",
        "key": PA_API_KEY,
        "nlogs": max_logs,
        "query": f"(receive_time geq '{time_from}')",
    }

    response = requests.get(url, params=params, verify=False)
    root = ET.fromstring(response.text)
    job_id = root.findtext(".//job")

    if not job_id:
        print("Błąd: brak job ID")
        return []

    print(f"Job ID: {job_id} — czekam na wyniki...")

    for attempt in range(20):
        time.sleep(2)
        result_response = requests.get(
            url,
            params={
                "type": "log",
                "action": "get",
                "job-id": job_id,
                "key": PA_API_KEY,
            },
            verify=False
        )
        result_root = ET.fromstring(result_response.text)
        status = result_root.findtext(".//status")
        print(f"Status joba ({attempt+1}/20): {status}")

        if status == "FIN":
            return parse_logs(result_response.text)

    print("Timeout — job nie zakończył się w czasie")
    return []


def parse_logs(xml_text):
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []

    logs = []
    for entry in root.findall(".//entry"):
        log = {
            "src_ip": entry.findtext("src", ""),
            "dst_ip": entry.findtext("dst", ""),
            "src_zone": entry.findtext("from", ""),
            "dst_zone": entry.findtext("to", ""),
            "application": entry.findtext("app", ""),
            "dst_port": entry.findtext("dport", ""),
            "action": entry.findtext("action", ""),
            "bytes": entry.findtext("bytes", "0"),
            "rule": entry.findtext("rule", ""),
            "time": entry.findtext("receive_time", ""),
        }
        logs.append(log)

    return logs


def get_log_stats(logs):
    top_src = Counter(l["src_ip"] for l in logs if l["src_ip"]).most_common(10)
    top_dst = Counter(l["dst_ip"] for l in logs if l["dst_ip"]).most_common(10)
    top_apps = Counter(l["application"] for l in logs if l["application"]).most_common(10)
    top_ports = Counter(l["dst_port"] for l in logs if l["dst_port"]).most_common(10)
    top_zones = Counter(f"{l['src_zone']} -> {l['dst_zone']}" for l in logs).most_common(10)
    actions = Counter(l["action"] for l in logs)

    return {
        "total_logs": len(logs),
        "top_sources": [{"ip": ip, "count": c} for ip, c in top_src],
        "top_destinations": [{"ip": ip, "count": c} for ip, c in top_dst],
        "top_applications": [{"app": app, "count": c} for app, c in top_apps],
        "top_ports": [{"port": port, "count": c} for port, c in top_ports],
        "top_zone_pairs": [{"pair": pair, "count": c} for pair, c in top_zones],
        "actions": dict(actions),
    }