import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

client = Anthropic(timeout=600.0)  # 10 minut timeout


def analyze_logs(logs: list, stats: dict) -> str:
    stats_json = json.dumps(stats, indent=2, ensure_ascii=False)
    today = datetime.now().strftime("%d.%m.%Y")

    # Ogranicz logi do 200 próbki żeby nie przekroczyć limitu tokenów
    sample = logs[:200]
    sample_json = json.dumps(sample, indent=2, ensure_ascii=False)

    prompt = f"""Jesteś ekspertem ds. bezpieczeństwa sieci i certyfikowanym inżynierem Palo Alto Networks.
Dzisiaj jest {today}.

Przeanalizuj poniższe logi ruchu sieciowego z firewalla Palo Alto i zasugeruj konkretne reguły bezpieczeństwa.

STATYSTYKI RUCHU (z {len(logs)} logów):
{stats_json}

PRÓBKA LOGÓW (pierwsze 200):
{sample_json}

Na podstawie analizy podaj:

1. WYKRYTE WZORCE RUCHU — opisz co widzisz

2. SUGEROWANE NOWE REGUŁY FIREWALL — dla każdej reguły:
   - Nazwa reguły
   - From / To (strefy)
   - Source / Destination IP
   - Aplikacja (App-ID)
   - Port/Serwis
   - Akcja (allow/deny)
   - Uzasadnienie

3. RUCH DO ZABLOKOWANIA

4. OPTYMALIZACJE istniejących reguł

Formatuj w Markdown."""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=20000,
        messages=[{"role": "user", "content": prompt}]
    )

    return message.content[0].text

def detect_anomalies_ai(logs: list, stats: dict) -> str:
    stats_json = json.dumps(stats, indent=2, ensure_ascii=False)
    today = datetime.now().strftime("%d.%m.%Y")
    sample = logs[:200]
    sample_json = json.dumps(sample, indent=2, ensure_ascii=False)

    prompt = f"""Jesteś ekspertem ds. cyberbezpieczeństwa. Dzisiaj jest {today}.

Przeanalizuj poniższe logi ruchu sieciowego i wykryj ANOMALIE oraz podejrzane wzorce.

STATYSTYKI (z {len(logs)} logów):
{stats_json}

PRÓBKA LOGÓW:
{sample_json}

Szukaj:
1. SKANOWANIE PORTÓW — jeden host łączy się do wielu portów
2. BEACONING — regularne połączenia do tego samego celu (C2)
3. DATA EXFILTRATION — duże transfery danych wychodzące
4. BRUTE FORCE — wiele nieudanych połączeń z jednego IP
5. LATERAL MOVEMENT — ruch między wewnętrznymi hostami
6. UNUSUAL PROTOCOLS — nieoczekiwane aplikacje lub porty
7. OFF-HOURS TRAFFIC — ruch w nietypowych godzinach

Dla każdej anomalii podaj:
- Typ anomalii
- Poziom ryzyka (KRYTYCZNY/WYSOKI/ŚREDNI)
- Involved IP addresses
- Opis co się dzieje
- Rekomendowana akcja

Formatuj w Markdown."""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text


def generate_rules_xml(logs: list, stats: dict) -> str:
    stats_json = json.dumps(stats, indent=2, ensure_ascii=False)
    sample = logs[:200]
    sample_json = json.dumps(sample, indent=2, ensure_ascii=False)

    prompt = f"""Jesteś ekspertem Palo Alto Networks. Na podstawie analizy logów wygeneruj reguły bezpieczeństwa w formacie XML PAN-OS gotowe do importu.

STATYSTYKI:
{stats_json}

PRÓBKA LOGÓW:
{sample_json}

Wygeneruj TYLKO czysty XML w formacie PAN-OS bez żadnego tekstu przed ani po. Format:

<config>
  <devices>
    <entry name="localhost.localdomain">
      <vsys>
        <entry name="vsys1">
          <rulebase>
            <security>
              <rules>
                <entry name="NAZWA-REGULY">
                  <from><member>STREFA-ZRODLOWA</member></from>
                  <to><member>STREFA-DOCELOWA</member></to>
                  <source><member>IP-LUB-ANY</member></source>
                  <destination><member>IP-LUB-ANY</member></destination>
                  <application><member>APLIKACJA</member></application>
                  <service><member>application-default</member></service>
                  <action>allow</action>
                  <log-start>no</log-start>
                  <log-end>yes</log-end>
                  <description>OPIS UZASADNIENIE</description>
                </entry>
              </rules>
            </security>
          </rulebase>
        </entry>
      </vsys>
    </entry>
  </devices>
</config>

Stwórz 5-10 konkretnych reguł na podstawie faktycznego ruchu w logach. Używaj prawdziwych stref i IP z logów."""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=15000,
        messages=[{"role": "user", "content": prompt}]
    )

    response = message.content[0].text.strip()
    # Wytnij tylko XML jeśli AI dodał komentarz przed/po
    if "<config>" in response:
        start = response.index("<config>")
        end = response.rindex("</config>") + len("</config>")
        return response[start:end]
    return response