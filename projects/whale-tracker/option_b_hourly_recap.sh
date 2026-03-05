#!/bin/bash
# Option B: Hourly Data Recap
# Run via cron to report collection progress every hour

cd /home/node/.openclaw/workspace/projects/whale-tracker

RECAP_FILE="polymarket/data/option_b_recap.txt"
DATA_DIR="polymarket/data"

# Get current timestamp
TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

# Count records in each file
PRICES=$(wc -l < "${DATA_DIR}/prices_autonomous.jsonl" 2>/dev/null || echo 0)
ORDERBOOKS=$(wc -l < "${DATA_DIR}/orderbooks_autonomous.jsonl" 2>/dev/null || echo 0)
RESOLUTIONS=$(grep -c '^[^t]' "${DATA_DIR}/resolutions_autonomous.csv" 2>/dev/null || echo 0)

# Calculate elapsed time
START_TIME=$(grep "STARTED" "${DATA_DIR}/option_b_autonomous_log.txt" 2>/dev/null | head -1 | cut -d'|' -f1)
if [ -n "$START_TIME" ]; then
    ELAPSED=$(python3 << 'PYTHON_EOF'
from datetime import datetime
start = datetime.fromisoformat("$START_TIME".strip())
now = datetime.utcnow()
diff = (now - start).total_seconds()
hours = int(diff / 3600)
minutes = int((diff % 3600) / 60)
print(f"{hours}h {minutes}m")
PYTHON_EOF
)
else
    ELAPSED="?"
fi

# Write recap
{
    echo "================================================================================"
    echo "📊 OPTION B AUTONOMOUS COLLECTION — HOURLY RECAP"
    echo "================================================================================"
    echo ""
    echo "Time: $TIMESTAMP"
    echo "Elapsed: $ELAPSED"
    echo ""
    echo "📈 DATA COLLECTED:"
    echo "   Binance prices: $PRICES"
    echo "   Order books: $ORDERBOOKS"
    echo "   Resolutions: $RESOLUTIONS"
    echo ""
    echo "✅ System Status: RUNNING"
    echo ""
} >> "$RECAP_FILE"

# Also print to stdout for log visibility
echo "[$TIMESTAMP] RECAP: Prices=$PRICES | Order Books=$ORDERBOOKS | Resolutions=$RESOLUTIONS"

