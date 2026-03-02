from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from paloalto_logs import get_traffic_logs, get_log_stats
from analyzer import analyze_logs
from database import save_analysis, get_all_analyses, get_analysis_by_id
from datetime import datetime
from analyzer import analyze_logs, detect_anomalies_ai, generate_rules_xml

app = FastAPI(title="Log Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "Log Analyzer API działa!"}


@app.get("/logs/stats")
def fetch_stats(hours: int = Query(24), max_logs: int = Query(5000)):
    try:
        logs = get_traffic_logs(max_logs=max_logs, hours=hours)
        stats = get_log_stats(logs)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/logs")
def fetch_logs(
    hours: int = Query(24),
    max_logs: int = Query(5000),
    src_ip: str = Query(None),
    dst_ip: str = Query(None),
    application: str = Query(None),
    src_zone: str = Query(None),
    dst_zone: str = Query(None),
):
    try:
        logs = get_traffic_logs(max_logs=max_logs, hours=hours)

        # Filtrowanie
        if src_ip:
            logs = [l for l in logs if src_ip.lower() in l["src_ip"].lower()]
        if dst_ip:
            logs = [l for l in logs if dst_ip.lower() in l["dst_ip"].lower()]
        if application:
            logs = [l for l in logs if application.lower() in l["application"].lower()]
        if src_zone:
            logs = [l for l in logs if src_zone.lower() in l["src_zone"].lower()]
        if dst_zone:
            logs = [l for l in logs if dst_zone.lower() in l["dst_zone"].lower()]

        return {"count": len(logs), "logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze")
def run_analysis(hours: int = Query(24), max_logs: int = Query(5000)):
    try:
        logs = get_traffic_logs(max_logs=max_logs, hours=hours)
        stats = get_log_stats(logs)
        report = analyze_logs(logs, stats)
        time_range = f"Ostatnie {hours}h"

        analysis_id = save_analysis(
            logs_count=len(logs),
            time_range=time_range,
            report_text=report
        )

        return {
            "id": analysis_id,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "logs_count": len(logs),
            "time_range": time_range,
            "stats": stats,
            "report": report
        }
    except Exception as e:
        import traceback
        print("BŁĄD:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyses")
def list_analyses():
    try:
        records = get_all_analyses()
        return [
            {
                "id": r.id,
                "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "logs_count": r.logs_count,
                "time_range": r.time_range,
            }
            for r in records
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: int):
    try:
        record = get_analysis_by_id(analysis_id)
        if not record:
            raise HTTPException(status_code=404, detail="Analiza nie znaleziona")
        return {
            "id": record.id,
            "timestamp": record.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "logs_count": record.logs_count,
            "time_range": record.time_range,
            "report": record.report,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs/timeline")
def get_timeline(hours: int = Query(24), max_logs: int = Query(5000)):
    try:
        logs = get_traffic_logs(max_logs=max_logs, hours=hours)
        from collections import defaultdict
        timeline = defaultdict(int)
        for log in logs:
            t = log.get("time", "")
            if len(t) >= 13:
                hour = t[:13]  # "2024/01/15 14"
                timeline[hour] += 1
        sorted_timeline = [{"hour": k, "count": v} for k, v in sorted(timeline.items())]
        return {"timeline": sorted_timeline}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/logs/top-talkers")
def get_top_talkers(hours: int = Query(24), max_logs: int = Query(5000)):
    try:
        logs = get_traffic_logs(max_logs=max_logs, hours=hours)
        from collections import defaultdict
        talkers = defaultdict(lambda: {"sent": 0, "received": 0, "connections": 0})

        for log in logs:
            src = log.get("src_ip", "")
            dst = log.get("dst_ip", "")
            try:
                bytes_val = int(log.get("bytes", 0))
            except:
                bytes_val = 0

            if src:
                talkers[src]["sent"] += bytes_val
                talkers[src]["connections"] += 1
            if dst:
                talkers[dst]["received"] += bytes_val

        result = [
            {
                "ip": ip,
                "sent_bytes": data["sent"],
                "received_bytes": data["received"],
                "total_bytes": data["sent"] + data["received"],
                "connections": data["connections"]
            }
            for ip, data in talkers.items()
        ]
        result.sort(key=lambda x: x["total_bytes"], reverse=True)
        return {"talkers": result[:20]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/anomalies")
def detect_anomalies(hours: int = Query(24), max_logs: int = Query(5000)):
    try:
        logs = get_traffic_logs(max_logs=max_logs, hours=hours)
        stats = get_log_stats(logs)
        report = detect_anomalies_ai(logs, stats)
        return {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "logs_count": len(logs),
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/export/xml")
def export_rules_xml(hours: int = Query(24), max_logs: int = Query(5000)):
    try:
        logs = get_traffic_logs(max_logs=max_logs, hours=hours)
        stats = get_log_stats(logs)
        xml = generate_rules_xml(logs, stats)
        from fastapi.responses import Response
        return Response(content=xml, media_type="application/xml",
                        headers={"Content-Disposition": "attachment; filename=suggested-rules.xml"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
