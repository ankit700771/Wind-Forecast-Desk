import sys
from datetime import date, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.dependencies import get_accuracy_service, get_decision_service

r = get_accuracy_service().report(date(2026, 1, 1), date(2026, 1, 31), time(9, 0))
print(r["summary"])
for h in r["by_horizon"]:
    print(h["label"], round(h["mae"]), round(h["bias"]), h["n"])
print(len(r["daily"]), "days")
d = get_decision_service().view(date(2026, 1, 15), time(9, 0))
print({k: v for k, v in d.items() if k != "rows"}, len(d["rows"]))
