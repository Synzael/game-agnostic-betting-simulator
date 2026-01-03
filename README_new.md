# Monte Carlo Betting Simulator

A robust Monte Carlo simulator for evaluating loss-recovery betting strategies using modified Fibonacci ladders. This tool helps you understand the risk-reward trade-offs of progressive betting systems in games with a house edge.

## ⚠️ Important Disclaimer

**This simulator is for educational and research purposes only.** It demonstrates that:
- No betting system can overcome the house edge in the long run
- All strategies have negative expected value over time
- Results are highly sensitive to bankroll size and risk tolerance
- Past performance does not guarantee future results

**Do not use this for actual gambling decisions.**

## 🎯 What Does This Simulator Do?

The simulator evaluates a **loss-recovery betting strategy** where:
- You start with a small bet
- When you **lose**, you move **up 1 step** on a ladder (increase your bet)
- When you **win**, you move **down 2 steps** (decrease your bet more aggressively)
- You can chain multiple "ladders" together as stakes escalate
- The goal is to find a "safe" profit target you can reliably hit before going broke

### Real-World Example

Imagine playing roulette on red/black:
1. Start betting $5 (bottom of Ladder 1)
2. **Lose** → Bet $10 (up 1 step)
3. **Lose** → Bet $15 (up 1 step)
4. **Win** → Bet $5 (down 2 steps, back to start)
5. **Lose** → Bet $10 (up 1 step)
6. Keep going until you reach your profit target (e.g., +$100) or hit your stop-loss

## 🚀 Quick Start

### Basic Usage

```bash
# Run with default settings (recommended first run)
python simulator.py

# Run unit tests to verify everything works
python simulator.py --run-tests

# Custom simulation
python simulator.py --bankroll 100000 --n-sessions 10000 --policy advance_to_next_ladder_start
```

### What You'll Get

The simulator will:
1. Test different profit targets (e.g., $50, $100, $150, ...)
2. Run thousands of simulated sessions for each target
3. Find the largest "safe" profit target where your risk of ruin ≤ 1%
4. Generate detailed statistics and save results to JSON/CSV files

## 📊 Key Parameters

### Bankroll Settings

- **`--bankroll`** (default: 800,000)
  - Your starting capital in dollars
  - **Larger = safer** but requires more capital
  - Example: `--bankroll 50000`

- **`--stop-loss-pct`** (default: 10.0)
  - Maximum loss as % of bankroll before you stop
  - Acts as a safety net to prevent total ruin
  - Example: `--stop-loss-pct 5.0` (stop at -5% of bankroll)

### Simulation Settings

- **`--n-sessions`** (default: 100,000)
  - Number of independent sessions to simulate
  - **More sessions = more accurate** but slower
  - 10,000+ recommended for reliable results
  - Example: `--n-sessions 50000`

- **`--alpha`** (default: 0.01)
  - Maximum acceptable probability of ruin (1% = 0.01)
  - The "safe" target ensures P(ruin) ≤ alpha
  - Lower = more conservative
  - Example: `--alpha 0.05` (5% risk tolerance)

- **`--profit-target-grid`** (default: "50:5000:50")
  - Range of profit targets to test (min:max:step)
  - Format: `start:end:increment`
  - Example: `--profit-target-grid 100:1000:50` tests $100, $150, $200, ..., $1000

### Bridging Policies

When you lose at the **top of a ladder**, you need a "bridging policy" to decide what happens next:

- **`--policy advance_to_next_ladder_start`** (default, recommended)
  - Move to the next ladder and start at index 0
  - Conservative: gives you room to recover on the next ladder
  - Example: L1 top ($275) → L2 start ($50)

- **`--policy carry_over_index_delta`** (advanced)
  - Enter "recovery mode" with a specific profit target
  - Move to next ladder at a configurable offset
  - When recovery target is hit, reset to Ladder 1, index 0
  - More aggressive but complex

- **`--policy stop_at_table_limit`** (most conservative)
  - Stop the session immediately
  - Treats top-of-ladder as hard failure
  - Safest but limits upside potential

## 📈 Understanding the Output

### Success Metrics

```
P(Hit Target):         99.30%   ← You hit your profit goal 99.3% of the time
P(Hit Stop Loss):      0.70%    ← You hit stop-loss 0.7% of the time
Ruin Probability:      0.7000%  ← Total risk of "ruin" (stop-loss + other failures)
```

### PnL Metrics

```
Expected PnL:          $22.85   ← Average profit per session
Median PnL:            $100.00  ← Typical profit when you win
Std Dev:               $1,011   ← How much results vary
Skewness:              -12.075  ← Distribution is left-skewed (big losses are rare but painful)
```

**Key Insight:** Notice how Expected PnL ($22.85) is much lower than Median PnL ($100)? This is because:
- You win small amounts frequently (99.3% of the time)
- You lose BIG amounts rarely (0.7% of the time)
- Those rare big losses drag down your average

### Risk Metrics

```
Mean Max Stake:        $249.37  ← Average highest bet you'll make
P(Touch Ladder L2):    16.5%    ← Chance you'll need the second ladder
P(Hit Top of Ladder):  16.50%   ← How often you hit dangerous territory
```

## 🎲 Default Ladder Configuration

The simulator uses three pre-configured Fibonacci-style ladders:

**Ladder 1 (L1):** `[5, 10, 15, 25, 40, 65, 105, 170, 275]`
- Entry-level stakes for early betting

**Ladder 2 (L2):** `[50, 100, 150, 250, 400, 650, 1050, 1750]`
- Medium stakes when losses escalate

**Ladder 3 (L3):** `[500, 1000, 1500, 2500, 4000, 6500, 10500, 17000, 27500, 44500]`
- High stakes for severe losing streaks

## 🔍 Example Scenarios

### Conservative Player (Low Risk)

```bash
python simulator.py \
  --bankroll 200000 \
  --n-sessions 50000 \
  --alpha 0.005 \
  --stop-loss-pct 5.0 \
  --policy advance_to_next_ladder_start \
  --profit-target-grid 25:200:25
```

- Large bankroll relative to bets
- Only 0.5% acceptable risk
- Tight stop-loss at -5%
- Looking for small, reliable wins ($25-$200)

### Aggressive Player (Higher Risk)

```bash
python simulator.py \
  --bankroll 50000 \
  --n-sessions 20000 \
  --alpha 0.02 \
  --stop-loss-pct 15.0 \
  --policy carry_over_index_delta \
  --profit-target-grid 100:500:50
```

- Smaller bankroll
- 2% acceptable risk
- Wider stop-loss tolerance
- Using recovery mode for bigger swings

## 📁 Output Files

After running, you'll get timestamped files to prevent collisions:

1. **`simulation_results_YYYYMMDD_HHMMSS.json`**
   - Complete simulation parameters
   - Safe profit target recommendation
   - Detailed statistics (PnL, risk metrics, probabilities)
   - Example: `simulation_results_20260103_153045.json`

2. **`trade_off_curve_YYYYMMDD_HHMMSS.csv`**
   - Risk vs. reward for every profit target tested
   - Useful for plotting trade-off curves in Excel/Python
   - Columns: profit_target, ruin_probability, prob_hit_target, mean_pnl, etc.
   - Example: `trade_off_curve_20260103_153045.csv`

Both files share the same timestamp so you can easily match results from the same run.

## 🧪 Advanced: Strategy Configuration

For developers wanting to modify the strategy parameters:

```python
# In code, you can customize recovery mode settings
strategy = StrategyConfig(
    ladders=create_default_ladders(),
    bridging_policy="carry_over_index_delta",
    recovery_target_pct=0.5,  # Recover 50% of losses before resetting
    crossover_offset=1         # Start at index 1 in next ladder (not 0)
)
```

### Recovery Mode Explained

When using `carry_over_index_delta`:

1. You lose at the top of L1 (stake = $275, you're down $500)
2. **Enter recovery mode:**
   - Recovery target = current_pnl + (|current_pnl| × recovery_target_pct)
   - Example: -$500 + ($500 × 0.5) = -$250
3. Move to L2 at `crossover_offset` (default: index 0 = $50)
4. Play normally, tracking progress toward -$250
5. When you hit -$250 or better: **reset to L1, index 0**

## 🎓 Key Concepts

### What is "Ruin"?

Ruin occurs when you:
- Hit your stop-loss (lost too much money)
- Exceed table maximum (can't make the required bet)
- Run out of bankroll (can't afford next bet)
- Hit max rounds without reaching target

### Why Does House Edge Matter?

The simulator assumes:
- **Game:** Even-money bets (like red/black in roulette)
- **Payout:** 1:1 (win $X, bet $X)
- **Probability:** p_win = 0.495 (49.5%)
- **House Edge:** 1% (because 0.495 × 2 = 0.99)

**No betting system can overcome this.** The house always wins in the long run.

### Safe Target vs. Expected Value

- **Safe Target:** The profit goal you can hit 99% of the time (low ruin risk)
- **Expected Value:** Your average profit (usually much lower due to rare big losses)

You're trading **consistency** (high win rate) for **value** (positive expected return).

## 🤝 Contributing

Found a bug? Have an idea? Open an issue or submit a pull request!

## 📜 License

This project is for educational purposes. Use at your own risk.

## 🔗 Further Reading

- [Martingale Betting System](https://en.wikipedia.org/wiki/Martingale_(betting_system))
- [Fibonacci Betting System](https://en.wikipedia.org/wiki/Fibonacci_sequence#Fibonacci_sequence_and_the_golden_ratio)
- [Kelly Criterion](https://en.wikipedia.org/wiki/Kelly_criterion)
- [Gambler's Ruin Problem](https://en.wikipedia.org/wiki/Gambler%27s_ruin)

---

**Remember:** The house always has the edge. This simulator helps you understand the mathematics, but it cannot create a winning strategy out of a losing game.
#   - g a m e - a g n o s t i c - b e t t i n g - s i m u l a t o r  
 