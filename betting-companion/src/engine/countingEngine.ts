/**
 * EZ Baccarat side-bet counting engine.
 *
 * Research constants in this module are taken from Jacobson (2011) for the
 * Dragon 7 and Panda 8 counting systems and the prompt's derived baseline
 * projections for an 8-deck shoe with a 14-card cut depth.
 */

export type SideBetKey = "dragon7" | "panda8";

export type CountZone = "red" | "yellow" | "green";

export type CardRank =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | "A"
  | "J"
  | "Q"
  | "K";

type NormalizedRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface SideBetDefinition {
  readonly key: SideBetKey;
  readonly label: string;
  readonly triggerTrueCount: number;
  readonly expectedEdgeWhenBettingPct: number;
  readonly betFrequencyPct: number;
  readonly baselineHouseEdgePct: number;
  readonly baselineProfitPerHourPer100: number;
  readonly baselineProfitPerShoePer100: number;
}

interface SideBetAccumulator {
  runningCount: number;
  betsMade: number;
  totalUnitsWagered: number;
  theoreticalProfitUnits: number;
}

/**
 * Serializable engine configuration shared across JS/TS, Python, and React.
 */
export interface CountingEngineConfig {
  readonly deckCount: number;
  readonly cardsPerDeck: number;
  readonly cutCardCards: number;
  readonly handsAfterCutCard: number;
  readonly burnCardExposed: boolean;
  readonly zeroValueBurnCount: number;
  readonly betSize: number;
}

/**
 * Per-side-bet state snapshot.
 */
export interface SideBetSnapshot {
  readonly key: SideBetKey;
  readonly label: string;
  readonly runningCount: number;
  readonly trueCount: number;
  readonly triggerTrueCount: number;
  readonly countsFromTrigger: number;
  readonly countsToTrigger: number;
  readonly zone: CountZone;
  readonly recommendation: "BET" | "NO BET";
  readonly shouldBet: boolean;
  readonly currentEdgePct: number;
  readonly edgePctDisplay: string;
  readonly expectedEdgeWhenBettingPct: number;
  readonly betFrequencyPct: number;
  readonly baselineHouseEdgePct: number;
  readonly betsMade: number;
  readonly totalUnitsWagered: number;
  readonly totalDollarsWagered: number;
  readonly theoreticalProfitUnits: number;
  readonly theoreticalProfitDollars: number;
  readonly projectedRemainingProfitUnits: number;
  readonly projectedRemainingProfitDollars: number;
  readonly projectedShoeProfitUnits: number;
  readonly projectedShoeProfitDollars: number;
  readonly projectedHourlyProfitUnits: number;
  readonly projectedHourlyProfitDollars: number;
}

/**
 * Full engine snapshot for transport across layers.
 */
export interface CountingSnapshot {
  readonly config: CountingEngineConfig;
  readonly cardsSeen: number;
  readonly cardsRemaining: number;
  readonly decksRemaining: number;
  readonly shoeProgress: number;
  readonly shoeProgressPct: number;
  readonly handsCompleted: number;
  readonly cutCardReached: boolean;
  readonly handsCompletedSinceCutCard: number;
  readonly handsRemainingBeforeShuffle: number;
  readonly recommendShuffle: boolean;
  readonly systems: Record<SideBetKey, SideBetSnapshot>;
  readonly totalUnitsWagered: number;
  readonly totalDollarsWagered: number;
  readonly totalTheoreticalProfitUnits: number;
  readonly totalTheoreticalProfitDollars: number;
  readonly projectedRemainingProfitUnits: number;
  readonly projectedRemainingProfitDollars: number;
  readonly projectedShoeProfitUnits: number;
  readonly projectedShoeProfitDollars: number;
  readonly projectedHourlyProfitUnits: number;
  readonly projectedHourlyProfitDollars: number;
}

const SIDE_BET_DEFINITIONS: Record<SideBetKey, SideBetDefinition> = {
  dragon7: {
    key: "dragon7",
    label: "Dragon 7",
    triggerTrueCount: 4,
    expectedEdgeWhenBettingPct: 8.03,
    betFrequencyPct: 9.16,
    baselineHouseEdgePct: 7.611,
    baselineProfitPerHourPer100: 44.9,
    baselineProfitPerShoePer100: 59.67,
  },
  panda8: {
    key: "panda8",
    label: "Panda 8",
    triggerTrueCount: 11,
    expectedEdgeWhenBettingPct: 6.34,
    betFrequencyPct: 4.61,
    baselineHouseEdgePct: 10.19,
    baselineProfitPerHourPer100: 17.8,
    baselineProfitPerShoePer100: 23.8,
  },
};

const DRAGON7_TAGS: Record<NormalizedRank, number> = {
  0: 0,
  1: 0,
  2: 0,
  3: -1,
  4: -1,
  5: -1,
  6: -1,
  7: -1,
  8: 2,
  9: 2,
};

const PANDA8_TAGS: Record<NormalizedRank, number> = {
  0: 1,
  1: 1,
  2: 1,
  3: -2,
  4: -2,
  5: -2,
  6: -1,
  7: -1,
  8: -2,
  9: 4,
};

const PANDA8_EDGE_BY_TRUE_COUNT: Record<number, number> = {
  11: 0.82,
  12: 1.69,
  13: 2.68,
  14: 3.67,
  15: 4.57,
};

/**
 * Default 8-deck EZ Baccarat shoe configuration from the prompt.
 */
export const DEFAULT_COUNTING_ENGINE_CONFIG: CountingEngineConfig = {
  deckCount: 8,
  cardsPerDeck: 52,
  cutCardCards: 14,
  handsAfterCutCard: 1,
  burnCardExposed: true,
  zeroValueBurnCount: 10,
  betSize: 100,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalizeRank(rank: CardRank): NormalizedRank {
  if (rank === "A") return 1;
  if (rank === "J" || rank === "Q" || rank === "K" || rank === 10) {
    return 0;
  }
  if (rank >= 0 && rank <= 9) {
    return rank;
  }
  throw new Error(`Unsupported card rank: ${String(rank)}`);
}

function validateConfig(config: CountingEngineConfig): void {
  if (config.deckCount <= 0) {
    throw new Error("deckCount must be positive");
  }
  if (config.cardsPerDeck <= 0) {
    throw new Error("cardsPerDeck must be positive");
  }
  if (config.cutCardCards < 0) {
    throw new Error("cutCardCards cannot be negative");
  }
  if (config.handsAfterCutCard < 0) {
    throw new Error("handsAfterCutCard cannot be negative");
  }
  if (config.zeroValueBurnCount <= 0) {
    throw new Error("zeroValueBurnCount must be positive");
  }
  if (config.betSize <= 0) {
    throw new Error("betSize must be positive");
  }
}

function createAccumulators(): Record<SideBetKey, SideBetAccumulator> {
  return {
    dragon7: {
      runningCount: 0,
      betsMade: 0,
      totalUnitsWagered: 0,
      theoreticalProfitUnits: 0,
    },
    panda8: {
      runningCount: 0,
      betsMade: 0,
      totalUnitsWagered: 0,
      theoreticalProfitUnits: 0,
    },
  };
}

function getDragon7EdgePct(trueCount: number): number {
  if (trueCount < SIDE_BET_DEFINITIONS.dragon7.triggerTrueCount) {
    return 0;
  }
  return 1.02 + (trueCount - SIDE_BET_DEFINITIONS.dragon7.triggerTrueCount) * 1.0;
}

function getPanda8EdgePct(trueCount: number): number {
  if (trueCount < SIDE_BET_DEFINITIONS.panda8.triggerTrueCount) {
    return 0;
  }
  const mappedEdge = PANDA8_EDGE_BY_TRUE_COUNT[trueCount];
  if (mappedEdge !== undefined) {
    return mappedEdge;
  }
  return PANDA8_EDGE_BY_TRUE_COUNT[15] + (trueCount - 15) * 0.9;
}

function getInterpolatedEdgePct(key: SideBetKey, trueCount: number): number {
  return key === "dragon7" ? getDragon7EdgePct(trueCount) : getPanda8EdgePct(trueCount);
}

function getZone(trueCount: number, triggerTrueCount: number): CountZone {
  if (trueCount >= triggerTrueCount) {
    return "green";
  }
  if (trueCount >= triggerTrueCount - 2) {
    return "yellow";
  }
  return "red";
}

function formatEdgePct(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Stateful counting engine with deterministic snapshot output.
 */
export class CountingEngine {
  private config: CountingEngineConfig;

  private readonly totalCards: number;

  private cardsSeen = 0;

  private handsCompleted = 0;

  private cutCardReached = false;

  private handsCompletedSinceCutCard = 0;

  private accumulators: Record<SideBetKey, SideBetAccumulator> = createAccumulators();

  constructor(config: Partial<CountingEngineConfig> = {}) {
    this.config = { ...DEFAULT_COUNTING_ENGINE_CONFIG, ...config };
    validateConfig(this.config);
    this.totalCards = this.config.deckCount * this.config.cardsPerDeck;
  }

  /**
   * Record a revealed card, including burn cards.
   */
  cardSeen(rank: CardRank): CountingSnapshot {
    const normalizedRank = normalizeRank(rank);
    this.accumulators.dragon7.runningCount += DRAGON7_TAGS[normalizedRank];
    this.accumulators.panda8.runningCount += PANDA8_TAGS[normalizedRank];
    this.cardsSeen += 1;

    if (!this.cutCardReached && this.getCardsRemaining() <= this.config.cutCardCards) {
      this.cutCardReached = true;
      this.handsCompletedSinceCutCard = 0;
    }

    return this.getState();
  }

  /**
   * Evaluate both side bets at the end of a hand and update per-shoe totals.
   */
  completeHand(units: number = 1): CountingSnapshot {
    if (units <= 0) {
      throw new Error("units must be positive");
    }

    const state = this.getState();
    (Object.keys(state.systems) as SideBetKey[]).forEach((key) => {
      const system = state.systems[key];
      if (!system.shouldBet) {
        return;
      }

      const accumulator = this.accumulators[key];
      accumulator.betsMade += 1;
      accumulator.totalUnitsWagered += units;
      accumulator.theoreticalProfitUnits += units * (system.currentEdgePct / 100);
    });

    this.handsCompleted += 1;
    if (this.cutCardReached) {
      this.handsCompletedSinceCutCard += 1;
    }

    return this.getState();
  }

  /**
   * Update bet size used for dollar-denominated projections.
   */
  setBetSize(betSize: number): CountingSnapshot {
    this.config = { ...this.config, betSize };
    validateConfig(this.config);
    return this.getState();
  }

  /**
   * Reset counts and per-shoe statistics for a fresh shoe.
   */
  resetShoe(): CountingSnapshot {
    this.cardsSeen = 0;
    this.handsCompleted = 0;
    this.cutCardReached = false;
    this.handsCompletedSinceCutCard = 0;
    this.accumulators = createAccumulators();
    return this.getState();
  }

  /**
   * Return the burn count implied by the exposed first card.
   */
  getBurnCount(rank: CardRank): number {
    const normalizedRank = normalizeRank(rank);
    return normalizedRank === 0 ? this.config.zeroValueBurnCount : normalizedRank;
  }

  /**
   * Read the current snapshot without mutating engine state.
   */
  getState(): CountingSnapshot {
    const cardsRemaining = this.getCardsRemaining();
    const decksRemaining = cardsRemaining / this.config.cardsPerDeck;
    const decksRemainingForTrueCount =
      Math.max(cardsRemaining, 1) / this.config.cardsPerDeck;
    const playableCards = Math.max(this.totalCards - this.config.cutCardCards, 1);
    const shoeProgress = clamp(this.cardsSeen / playableCards, 0, 1);

    const systems = {} as Record<SideBetKey, SideBetSnapshot>;
    let totalUnitsWagered = 0;
    let totalTheoreticalProfitUnits = 0;
    let projectedRemainingProfitUnits = 0;
    let projectedShoeProfitUnits = 0;
    let projectedHourlyProfitUnits = 0;

    (Object.keys(SIDE_BET_DEFINITIONS) as SideBetKey[]).forEach((key) => {
      const definition = SIDE_BET_DEFINITIONS[key];
      const accumulator = this.accumulators[key];
      const trueCount = Math.trunc(accumulator.runningCount / decksRemainingForTrueCount);
      const currentEdgePct = getInterpolatedEdgePct(key, trueCount);
      const countsFromTrigger = trueCount - definition.triggerTrueCount;
      const shouldBet = trueCount >= definition.triggerTrueCount;
      const baselineUnitsPerShoe = definition.baselineProfitPerShoePer100 / 100;
      const remainingRatio = 1 - shoeProgress;
      const projectedRemainingUnits = baselineUnitsPerShoe * remainingRatio;
      const projectedShoeUnits =
        accumulator.theoreticalProfitUnits + projectedRemainingUnits;
      const shoesPerHour =
        definition.baselineProfitPerHourPer100 / definition.baselineProfitPerShoePer100;
      const projectedHourlyUnits = projectedShoeUnits * shoesPerHour;

      systems[key] = {
        key,
        label: definition.label,
        runningCount: accumulator.runningCount,
        trueCount,
        triggerTrueCount: definition.triggerTrueCount,
        countsFromTrigger,
        countsToTrigger: Math.max(definition.triggerTrueCount - trueCount, 0),
        zone: getZone(trueCount, definition.triggerTrueCount),
        recommendation: shouldBet ? "BET" : "NO BET",
        shouldBet,
        currentEdgePct,
        edgePctDisplay: formatEdgePct(currentEdgePct),
        expectedEdgeWhenBettingPct: definition.expectedEdgeWhenBettingPct,
        betFrequencyPct: definition.betFrequencyPct,
        baselineHouseEdgePct: definition.baselineHouseEdgePct,
        betsMade: accumulator.betsMade,
        totalUnitsWagered: accumulator.totalUnitsWagered,
        totalDollarsWagered: accumulator.totalUnitsWagered * this.config.betSize,
        theoreticalProfitUnits: accumulator.theoreticalProfitUnits,
        theoreticalProfitDollars:
          accumulator.theoreticalProfitUnits * this.config.betSize,
        projectedRemainingProfitUnits: projectedRemainingUnits,
        projectedRemainingProfitDollars:
          projectedRemainingUnits * this.config.betSize,
        projectedShoeProfitUnits: projectedShoeUnits,
        projectedShoeProfitDollars: projectedShoeUnits * this.config.betSize,
        projectedHourlyProfitUnits: projectedHourlyUnits,
        projectedHourlyProfitDollars: projectedHourlyUnits * this.config.betSize,
      };

      totalUnitsWagered += accumulator.totalUnitsWagered;
      totalTheoreticalProfitUnits += accumulator.theoreticalProfitUnits;
      projectedRemainingProfitUnits += projectedRemainingUnits;
      projectedShoeProfitUnits += projectedShoeUnits;
      projectedHourlyProfitUnits += projectedHourlyUnits;
    });

    const handsRemainingBeforeShuffle = this.cutCardReached
      ? Math.max(
          this.config.handsAfterCutCard -
            Math.max(this.handsCompletedSinceCutCard - 1, 0),
          0
        )
      : this.config.handsAfterCutCard;

    return {
      config: { ...this.config },
      cardsSeen: this.cardsSeen,
      cardsRemaining,
      decksRemaining,
      shoeProgress,
      shoeProgressPct: shoeProgress * 100,
      handsCompleted: this.handsCompleted,
      cutCardReached: this.cutCardReached,
      handsCompletedSinceCutCard: this.handsCompletedSinceCutCard,
      handsRemainingBeforeShuffle,
      recommendShuffle:
        this.cutCardReached &&
        this.handsCompletedSinceCutCard > this.config.handsAfterCutCard,
      systems,
      totalUnitsWagered,
      totalDollarsWagered: totalUnitsWagered * this.config.betSize,
      totalTheoreticalProfitUnits,
      totalTheoreticalProfitDollars:
        totalTheoreticalProfitUnits * this.config.betSize,
      projectedRemainingProfitUnits,
      projectedRemainingProfitDollars:
        projectedRemainingProfitUnits * this.config.betSize,
      projectedShoeProfitUnits,
      projectedShoeProfitDollars: projectedShoeProfitUnits * this.config.betSize,
      projectedHourlyProfitUnits,
      projectedHourlyProfitDollars:
        projectedHourlyProfitUnits * this.config.betSize,
    };
  }

  private getCardsRemaining(): number {
    return Math.max(this.totalCards - this.cardsSeen, 0);
  }
}
