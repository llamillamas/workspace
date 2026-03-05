#!/usr/bin/env python3
"""
Option B: Monitoring Daemon
Runs every hour and reports data collection status
Can run alongside autonomous collection
"""

import json
import time
from datetime import datetime
from pathlib import Path
import sys

DATA_DIR = Path("polymarket/data")
RECAP_FILE = DATA_DIR / "option_b_recap.txt"

def log_recap():
    """Generate and log hourly recap"""
    
    # Count data in files
    prices_count = 0
    orderbooks_count = 0
    resolutions_count = 0
    
    # Count prices
    price_file = DATA_DIR / "prices_autonomous.jsonl"
    if price_file.exists():
        with open(price_file, 'r') as f:
            prices_count = len([l for l in f if l.strip()])
    
    # Count order books
    ob_file = DATA_DIR / "orderbooks_autonomous.jsonl"
    if ob_file.exists():
        with open(ob_file, 'r') as f:
            orderbooks_count = len([l for l in f if l.strip()])
    
    # Count resolutions
    res_file = DATA_DIR / "resolutions_autonomous.csv"
    if res_file.exists():
        with open(res_file, 'r') as f:
            lines = [l for l in f if l.strip() and not l.startswith('timestamp')]
            resolutions_count = len(lines)
    
    # Write recap
    timestamp = datetime.now().isoformat()
    
    recap = f"""
================================================================================
📊 OPTION B AUTONOMOUS COLLECTION — HOURLY RECAP
================================================================================
Time: {timestamp}

📈 DATA COLLECTED:
   ✅ Binance prices: {prices_count:,}
   ✅ Order books: {orderbooks_count:,}
   ✅ Resolutions: {resolutions_count:,}

✅ System Status: RUNNING
================================================================================
"""
    
    # Print to console
    print(recap)
    
    # Append to file
    with open(RECAP_FILE, "a") as f:
        f.write(recap + "\n")

if __name__ == "__main__":
    print(f"Starting monitoring daemon at {datetime.now().isoformat()} UTC")
    print("Will report data status every hour...")
    print("")
    
    try:
        while True:
            # Report every hour (3600 seconds)
            time.sleep(3600)
            log_recap()
    except KeyboardInterrupt:
        print("\nMonitoring daemon stopped")

