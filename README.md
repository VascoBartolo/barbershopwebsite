# Johny Cutz — Barbershop Website

Website + sistema de marcações para a barbearia **Johny Cutz** (Ilha Terceira, Açores).

## Estrutura

```
website/    Frontend React (Vite) — página principal + página de marcação
backend/    API Flask — marcações, disponibilidade, Google Calendar, emails SMTP
docker-compose.yml   Postgres + backend + frontend
```

## Serviços & Preços

| Serviço        | Preço |
|----------------|-------|
| Cabelo         | 12€   |
| Barba          | 5€    |
| Cabelo & Barba | 17€   |

## Durações

Regras implementadas em `backend/catalog.py` (espelhadas no frontend em `BookingPage.jsx`):

| Caso                                   | Duração |
|----------------------------------------|---------|
| Tesoura (corte simples/social)         | 15 min  |
| Buzzcut                                | 30 min  |
| Qualquer outro corte (mullet, fades, taper, outros) | 45 min |
| Barba (isolada ou adicionada ao corte) | 15 min  |
| Qualquer corte "sem cortar em cima" (opção no formulário) | máx. 30 min |

`Cabelo & Barba` = duração do corte + 15 min.

## Horário

Segunda a sábado, 09h00–19h00 (domingo encerrado). Configurável no `.env` do
backend: `WORK_START`, `WORK_END`, `CLOSED_WEEKDAYS` (0=segunda … 6=domingo).
Slots em intervalos de 15 minutos. Fuso horário: `Atlantic/Azores`.

## Como correr

### Com Docker (tudo incluído)

```bash
# 1. Configurar o backend
cp backend/.env.example backend/.env   # preencher SMTP_USER/SMTP_PASS etc.
# 2. Colocar a chave da service account do Google em backend/credentials.json
# 3. Arrancar
docker compose up --build
```

Frontend em http://localhost:3000, API em http://localhost:5000.

### Desenvolvimento local

```bash
# Backend (precisa de Postgres a correr, ver DATABASE_URL no .env)
cd backend
pip install -r requirements.txt
python app.py

# Frontend (proxy /api -> localhost:5000 já configurado no vite.config.js)
cd website
npm install
npm run dev
```

## Integrações

- **Google Calendar** — cada marcação cria um evento no calendário do barbeiro;
  eventos existentes no calendário bloqueiam horários. Requer service account
  (JSON em `backend/credentials.json`) com o calendário partilhado com o email
  da service account. `GOOGLE_CALENDAR_ID` define o calendário.
- **Email (SMTP)** — confirmação/cancelamento para o cliente e notificações
  (nova marcação, cancelamento, pedido de alteração) para o barbeiro
  (`BARBER_EMAIL`). Sem SMTP configurado, os emails são apenas registados no log.
- **Referências** — cada marcação recebe uma referência `JC-XXXXXXXX` usada
  para verificar/cancelar/pedir alteração na página de marcação.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/services` | Catálogo de serviços/cortes (preços + durações) |
| GET | `/api/availability?date=&servico=&corte=&sem_cima=` | Horários livres |
| POST | `/api/bookings` | Criar marcação |
| GET | `/api/bookings/lookup?reference=&email=` | Consultar marcação |
| PUT | `/api/bookings/<ref>/cancel` | Cancelar |
| PUT | `/api/bookings/<ref>/edit-request` | Pedir alteração (email ao barbeiro) |
| POST | `/api/contact` | Formulário de contacto |
