from paloalto_logs import get_traffic_logs, get_log_stats
from analyzer import analyze_logs
import json

print("Pobieranie logów Traffic...")
logs = get_traffic_logs(max_logs=100)
print(f"Pobrano {len(logs)} logów")

stats = get_log_stats(logs)
print("Statystyki:", json.dumps(stats, indent=2, ensure_ascii=False))

print("\nAnalizuję logi przez AI...")
report = analyze_logs(logs, stats)
print(report)