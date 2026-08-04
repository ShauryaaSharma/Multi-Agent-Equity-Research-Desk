"""
Smoke-test primary data providers.

Run from api_core/:
  python manage.py shell < scripts/probe_stack.py
  # or
  cd backend && python -c "exec(open('scripts/probe_stack.py').read())"
"""
from __future__ import annotations

import json
import os
import sys

# Allow running as standalone script
if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aerd_conf.settings")
    import django

    django.setup()

from newswire import finnhub_gateway as fh
from newswire import newsapi_gateway as na
from newswire.feed_merger import fetch_merged_news
from alpha_lab.replay import run_backtest
from alpha_lab.event_replay import check_options_chain_available, run_event_backtest


def check(name: str, ok: bool, detail: str = "") -> dict:
    return {"service": name, "ok": ok, "detail": detail}


results: list[dict] = []

# Provider gates
results.append(check("NewsAPI configured", na.is_configured(), "NEWSAPI_KEY set" if na.is_configured() else "missing NEWSAPI_KEY"))
results.append(check("Finnhub configured", fh.is_configured(), "FINNHUB_API_KEY set" if fh.is_configured() else "missing FINNHUB_API_KEY"))

# News
merged = fetch_merged_news("RELIANCE", limit=10, run_finbert=False)
results.append(check("Agent news merge", len(merged.get("articles", [])) > 0, f"sources={merged.get('sources')}"))

# Options chain (yfinance / Finnhub primary)
opt_reliance = check_options_chain_available("RELIANCE")
results.append(
    check(
        "Options chain RELIANCE",
        bool(opt_reliance.get("available")),
        f"source={opt_reliance.get('source')} proxy={opt_reliance.get('proxy')}",
    )
)
opt_nifty = check_options_chain_available("NIFTY50")
results.append(
    check(
        "Options chain NIFTY50",
        bool(opt_nifty.get("available")),
        f"source={opt_nifty.get('source')} proxy={opt_nifty.get('proxy')}",
    )
)

# Legacy backtest
bt = run_backtest(ticker="RELIANCE", use_alpha_sentiment=True, days=126)
results.append(
    check(
        "Sentiment backtest RELIANCE",
        "error" not in bt,
        bt.get("error") or f"sharpe={bt.get('price_only_sharpe')}",
    )
)

# Event backtest
ev = run_event_backtest(
    ticker="RELIANCE",
    mode="equity_delivery",
    template_id="sentiment_news_combo",
    days=90,
    only_news_events=False,
)
results.append(
    check(
        "Event backtest RELIANCE",
        not ev.get("error"),
        ev.get("error") or f"trades={(ev.get('summary') or {}).get('total_trades')}",
    )
)

# Agent pipeline (lightweight — no full HTTP)
try:
    from swarm.conductor import AgentOrchestrator

    articles = merged.get("articles") or [{"title": "Markets steady", "summary": "Test", "sentiment": "neutral"}]
    agent_out = AgentOrchestrator().run(articles[:5], ticker="RELIANCE", aggregate_sentiment="neutral")
    results.append(
        check(
            "Agent orchestrator",
            bool(agent_out.get("decision") or agent_out.get("pipeline")),
            f"decision={((agent_out.get('decision') or {}).get('recommendation') or 'n/a')}",
        )
    )
except Exception as exc:
    results.append(check("Agent orchestrator", False, str(exc)))

passed = sum(1 for r in results if r["ok"])
failed = [r for r in results if not r["ok"]]

print("\n=== AERD service health ===")
print(f"Passed: {passed}/{len(results)}\n")
for r in results:
    mark = "OK" if r["ok"] else "FAIL"
    print(f"  [{mark}] {r['service']}: {r['detail']}")
if failed:
    print("\nFailed checks:")
    for r in failed:
        print(f"  - {r['service']}: {r['detail']}")
print("\n" + json.dumps({"passed": passed, "total": len(results), "failed": [f["service"] for f in failed]}, indent=2))
