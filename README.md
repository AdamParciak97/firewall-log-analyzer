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
