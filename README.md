# 📡 Firewall Log Analyzer

AI-powered analiza logów ruchu sieciowego Palo Alto Networks z automatycznym sugerowaniem reguł firewall.


## Funkcjonalności
- 📊 Dashboard ze statystykami ruchu
- 📈 Wykres timeline ruchu per godzina
- 🏆 Top Talkers — hosty generujące najwięcej ruchu
- 🤖 Sugestie reguł firewall przez Claude AI
- 🚨 Anomaly Detection — wykrywanie podejrzanego ruchu
- 📤 Eksport reguł do XML PAN-OS gotowy do importu
- 📁 Historia analiz

## Stack
- **Backend**: Python + FastAPI + SQLAlchemy + Anthropic Claude API
- **Frontend**: React + Tailwind CSS + Recharts + Vite

## Uruchomienie
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Konfiguracja
Stwórz plik `backend/.env`:
```
PA_HOST=https://<ADRES_FIREWALL>
PA_API_KEY=<KLUCZ_API_PALO_ALTO>
ANTHROPIC_API_KEY=<KLUCZ_API_CLAUDE>
```


## 📸 Screenshots
<img width="1229" height="1052" alt="image" src="https://github.com/user-attachments/assets/528ba0ac-f9b9-4bae-bb1d-101c4ded867f" />

<img width="1207" height="1036" alt="image" src="https://github.com/user-attachments/assets/7933fdb1-d258-4501-b355-b76ddc21b30c" />

<img width="1326" height="946" alt="image" src="https://github.com/user-attachments/assets/eb4de3ba-006d-4293-af5d-e0696f165a45" />

<img width="1223" height="1035" alt="image" src="https://github.com/user-attachments/assets/4ebef842-0b9d-4308-ae1b-a134e4c7f850" />


