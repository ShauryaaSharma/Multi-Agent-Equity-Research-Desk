# Autonomous Equity Research Desk

**A trading desk that reads the news for you.**

AERD ingests market news as it breaks, scores it with a finance-tuned language model, argues about it across a committee of specialised agents, converts the surviving conviction into quantitative signals, and then checks those signals against history before it shows you anything.

It is one repository with two deployables: a Django/ASGI service (`api_core`) and a Next.js console (`console`).

---

## Why it exists

Most retail tooling stops at "here is a headline, here is a red or green dot." That is sentiment, not analysis. The gap between *a headline is negative* and *therefore do this, at this size, with this risk* is where the actual work lives.

AERD tries to close that gap mechanically:

- sentiment is a **feature**, never a conclusion
- every agent opinion carries its reasoning, so a bad call can be traced
- nothing reaches the UI as a recommendation until a replay over historical data has scored it
- a separate watchdog scores the probability of a near-term market shock, independent of the headline pipeline

---

## What's in the box

**Narrative layer.** Headlines are pulled from Alpha Vantage, Finnhub, NewsAPI and a set of RSS feeds, de-duplicated, and scored with FinBERT for tone plus confidence. An LLM (Groq, falling back to OpenAI) turns the scored batch into a plain-English briefing.

**The swarm.** Six units run over a shared context object: a headline hunter, a macro lens that ties stories to rates/CPI/GDP prints, a chart reader, a tape reader that looks for historical analogues, an exposure unit that names the tail risks, and a verdict unit that collapses everything into BUY / SELL / HOLD with a confidence number. A bull/bear roundtable runs adversarially before the verdict. Independently, a ticker probe does a single-symbol deep dive against sector peers.

**Alpha lab.** Indicator studies (RSI, MFI, MACD, Bollinger %B, VWAP distance), trigger construction, a strategy playbook engine with an LLM-assisted compiler, and replay harnesses — both plain and event-driven — reporting Sharpe, information coefficient, max drawdown and total return against a buy-and-hold baseline, with transaction costs and slippage modelled.

**Jolt radar.** A standalone scorer that emits a 0–100 shock probability for NIFTY and BankNIFTY from feed velocity, tone skew and cause classification. Crosses the threshold and it fires a Telegram alert and logs the event. Ships with a backfill command so the history table is never empty on a cold deploy.

**Console.** Next.js 15 / React 19. Live tape strip, wire feed, agent pipeline view, options chain with Greeks, screener, replay workbench, portfolio via Zerodha Kite, and a light/dark theme dock. Streams over WebSockets where the backend offers them, polls where it doesn't.

---

## Repository layout

```
api_core/                Django + DRF + Channels service
  aerd_conf/           settings, root URLconf, ASGI/WSGI, Celery app
  newswire/              ingestion, REST views, socket handlers, templates
  swarm/                 the agent committee and its conductor
  cognition/             LLM gateway + narrative briefings
  alpha_lab/             studies, triggers, replay, playbooks, benchmarks
  jolt_radar/            shock scoring, severity model, Telegram notifier
  conduits/              ingestion pipelines and Celery jobs
  scorecard/             accuracy and latency gauges
  crosslink/             cross-asset (crypto, FX, commodities) feeds
  scripts/probe_stack.py end-to-end service health probe

console/                 Next.js app
  app/                   routes, including /api edge handlers
  components/            aerd/ swarm/ wire/ jolt/ tape/ plots/ ui/
  hooks/ lib/ store/     data fetching, broker adapters, client state
  prisma/                edge database schema

feed_harvester/          standalone collection package (runs outside Django)
notes/                   design and integration deep-dives
```

---

## Running it

Requires Python 3.11 and Node 20+.

**Service:**

```bash
cd api_core
pip install -r requirements.txt
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 aerd_conf.asgi:application
```

`python manage.py runserver` also works, but you lose WebSockets.

**Console:**

```bash
cd console
npm install
npm run dev
```

Then open `http://localhost:3000`. API calls proxy to port 8000.

**Background workers** (optional — the app degrades gracefully without Redis):

```bash
cd api_core
celery -A aerd_conf worker -l info
```

**Seed the shock history:**

```bash
python manage.py replay_jolts --fast --indices nifty,banknifty
```

---

## Configuration

Copy `.env.example` and fill in what you need. Nothing here is required to boot — missing keys disable the feature that needs them rather than crashing the process.

| Variable | Purpose |
|---|---|
| `ALPHA_VANTAGE_API_KEY`, `FINNHUB_API_KEY`, `NEWSAPI_KEY` | market and news vendors |
| `GROQ_API_KEY`, `GROQ_MODEL`, `OPENAI_API_KEY` | LLM reasoning, in fallback order |
| `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` | Django core |
| `DATABASE_URL`, `DATABASE_SSL` | Postgres; omit both and it falls back to SQLite |
| `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | cache, channel layer, task queue |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | shock alert delivery |
| `KITE_API_KEY`, `KITE_API_SECRET`, `KITE_ACCESS_TOKEN` | Zerodha portfolio and option chain |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` | where the console looks for the service |
| `FEATURE_GENAI_INSIGHTS`, `FEATURE_AGENTS`, `FEATURE_QUANT_SIGNALS`, `FEATURE_WEBSOCKETS` | kill switches |

---

## HTTP surface

Grouped by what they're for rather than listed alphabetically.

**News and tone**

| Route | Verb | |
|---|---|---|
| `/api/fetch-news/` | GET | merged, cached news feed |
| `/api/analyze-sentiment/` | POST | FinBERT tone for supplied text |
| `/api/analyze-with-insights/` | POST | tone plus LLM briefing |
| `/api/custom-sentiment/` | POST | ticker-scoped tone from live wire |
| `/api/chart-data/` | GET | stored tone distribution and trend |

**Agents**

| Route | Verb | |
|---|---|---|
| `/api/agents/run/` | GET · POST | run the full committee |
| `/api/agents/symbol-deep-dive/?symbol=` | GET | single-symbol deep dive |
| `/api/trade/decision/?symbol=&hold_minutes=` | GET | intraday call with trade overlay |

**Quant**

| Route | Verb | |
|---|---|---|
| `/api/quant/signals/` | POST | build trigger payload |
| `/api/quant/catalog/` | GET | available indicator studies |
| `/api/quant/backtest/` | POST | replay a strategy |
| `/api/quant/backtest/compile/` | POST | compile a natural-language playbook |
| `/api/quant/research-benchmark/` | GET · POST | multi-strategy benchmark with costs |

**Shock watch**

| Route | Verb | |
|---|---|---|
| `/api/shock/score/` | GET | current 0–100 probability |
| `/api/shock/history/` | GET | backfilled shock events |
| `/api/shock/alerts/` | GET | alerts already fired |

**Everything else**

| Route | Verb | |
|---|---|---|
| `/api/live-ticker/` | GET | index and stock quotes |
| `/api/market/<symbol>/history/` | GET | OHLC series |
| `/api/scanner/` | GET | momentum + tone screener |
| `/api/options-chain/` | GET | calls and puts |
| `/api/cross-domain/?domain=` | GET | crypto / FX / commodity view |
| `/api/evaluation/sentiment-accuracy/` | POST | accuracy and F1 vs labels |
| `/api/evaluation/latency/` | GET | model latency gauge |
| `/api/health/` | GET | liveness |

**Sockets:** `ws/dashboard/` for console push, `ws/shock/` for the shock stream.

---

## Deployment

`api_core` deploys to Render from `render.yaml` (Postgres plus one Python web service, `rootDir: api_core`). `console` deploys to Vercel. Docker Compose files are provided for running things locally: `stack.prod.yml` for the full set, `stack.edge.yml` for just Postgres and Redis.

Step-by-step instructions live in [SHIPPING.md](./SHIPPING.md).

---

## Known rough edges

- FinBERT loads into memory on first request, so the first sentiment call after a cold start is slow. On a free-tier host this compounds with container spin-up.
- Without `REDIS_URL` the channel layer is in-process, so WebSocket fan-out does not survive more than one worker.
- Vendor free tiers are the binding constraint on refresh rate, not the code.
- Replay results are computed on adjusted daily bars; intraday claims should be read as directional, not executable.
- Nothing here is investment advice, and none of it is a licensed advisory product.

---

## Further reading

| Document | Covers |
|---|---|
| [HANDBOOK.md](./HANDBOOK.md) | full architecture and module-by-module reference |
| [WALKTHROUGH.md](./WALKTHROUGH.md) | guided tour of the system |
| [SHIPPING.md](./SHIPPING.md) | deployment runbook |
| [CONSOLE_SETUP.md](./CONSOLE_SETUP.md) | console setup detail |
| [notes/](./notes) | integration, data vendors, jolt radar, verdict engine, QA |
