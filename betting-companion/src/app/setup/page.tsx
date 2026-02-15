"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/store";
import { Button, Card, NumberInput } from "@/components/ui";
import {
  getAllPresets,
  createStrategyFromPreset,
  DEFAULT_SESSION_CONFIG,
  SessionConfig,
  PresetConfig,
  DEFAULT_LADDERS,
  formatStake,
} from "@/engine";

interface SetupValidationErrors {
  bankroll?: string;
  profitTarget?: string;
  stopLossAbs?: string;
}

function validateSessionConfig(config: SessionConfig): SetupValidationErrors {
  const errors: SetupValidationErrors = {};

  if (config.bankroll <= 0) {
    errors.bankroll = "Bankroll must be greater than 0.";
  }

  if (config.profitTarget <= 0) {
    errors.profitTarget = "Profit target must be greater than 0.";
  }

  if (config.stopLossAbs <= 0) {
    errors.stopLossAbs = "Stop loss must be greater than 0.";
  } else if (config.stopLossAbs > config.bankroll) {
    errors.stopLossAbs = "Stop loss cannot be greater than bankroll.";
  }

  return errors;
}

export default function SetupPage() {
  const router = useRouter();
  const startSession = useSessionStore((s) => s.startSession);
  const setDecisionMode = useSessionStore((s) => s.setDecisionMode);
  const decisionMode = useSessionStore((s) => s.decisionMode);

  const presets = getAllPresets();
  const [selectedPreset, setSelectedPreset] = useState<string>("default");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [config, setConfig] = useState<SessionConfig>({
    ...DEFAULT_SESSION_CONFIG,
  });
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const validationErrors = validateSessionConfig(config);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const handlePresetSelect = (preset: PresetConfig) => {
    setSelectedPreset(preset.name);
  };

  const handleStartSession = () => {
    if (hasValidationErrors) {
      setShowValidationSummary(true);
      return;
    }

    setShowValidationSummary(false);
    setShowWarningModal(true);
  };

  const confirmStartSession = () => {
    const strategy = createStrategyFromPreset(selectedPreset);
    startSession(config, strategy);
    setShowWarningModal(false);
    router.push("/session");
  };

  const updateConfig = (updates: Partial<SessionConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-slate-400 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-white">
          New Session
        </h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Preset Selection */}
        <div>
          <h2 className="text-sm text-slate-400 uppercase tracking-wide mb-3">
            Strategy Preset
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Card
                key={preset.name}
                variant={selectedPreset === preset.name ? "info" : "default"}
                interactive
                selected={selectedPreset === preset.name}
                className="p-3"
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="font-medium text-white text-sm">
                  {preset.displayName}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {preset.recoveryTargetPct * 100}% recovery
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {presets.find((p) => p.name === selectedPreset)?.description}
          </p>
        </div>

        {/* Session Configuration */}
        <div>
          <h2 className="text-sm text-slate-400 uppercase tracking-wide mb-3">
            Session Settings
          </h2>
          <div className="space-y-4">
            <NumberInput
              label="Starting Bankroll"
              value={config.bankroll}
              onChange={(v) => updateConfig({ bankroll: v })}
              min={0}
              prefix="$"
              hint="Your starting balance"
              error={validationErrors.bankroll}
            />
            <NumberInput
              label="Profit Target"
              value={config.profitTarget}
              onChange={(v) => updateConfig({ profitTarget: v })}
              min={0}
              prefix="$"
              hint="Session ends when you reach this profit"
              error={validationErrors.profitTarget}
            />
            <NumberInput
              label="Stop Loss"
              value={config.stopLossAbs}
              onChange={(v) => updateConfig({ stopLossAbs: v })}
              min={0}
              prefix="$"
              hint="Session ends if you lose this amount"
              error={validationErrors.stopLossAbs}
            />
          </div>
        </div>

        {/* Starting Ladder */}
        <div>
          <h2 className="text-sm text-slate-400 uppercase tracking-wide mb-3">
            Starting Ladder
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {DEFAULT_LADDERS.map((ladder, index) => {
              const minStake = ladder.stakes[0];
              const maxStake = ladder.stakes[ladder.stakes.length - 1];
              return (
                <Card
                  key={ladder.name}
                  variant={config.startingLadder === index ? "info" : "default"}
                  interactive
                  selected={config.startingLadder === index}
                  className="p-3"
                  onClick={() => updateConfig({ startingLadder: index })}
                >
                  <div className="font-medium text-white text-sm">
                    {ladder.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {formatStake(minStake)} – {formatStake(maxStake)}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Decision Mode */}
        <div>
          <h2 className="text-sm text-slate-400 uppercase tracking-wide mb-3">
            Decision Mode
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Card
              variant={decisionMode === "at_bridging_only" ? "info" : "default"}
              interactive
              selected={decisionMode === "at_bridging_only"}
              className="p-3"
              onClick={() => setDecisionMode("at_bridging_only")}
            >
              <div className="font-medium text-white text-sm">
                At Bridging Only
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Decisions only at ladder top
              </div>
            </Card>
            <Card
              variant={decisionMode === "every_bet" ? "info" : "default"}
              interactive
              selected={decisionMode === "every_bet"}
              className="p-3"
              onClick={() => setDecisionMode("every_bet")}
            >
              <div className="font-medium text-white text-sm">
                Every Bet
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Confirm each bet
              </div>
            </Card>
          </div>
        </div>

        {/* Start Button */}
        {showValidationSummary && hasValidationErrors && (
          <p className="text-sm text-red-400">
            Please fix invalid session settings before starting.
          </p>
        )}
        <Button
          variant="success"
          size="xl"
          fullWidth
          onClick={handleStartSession}
          className="mt-8"
        >
          Start Session
        </Button>
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border-2 border-pink-400 bg-pink-950/90 p-5 shadow-[0_0_40px_rgba(236,72,153,0.35)]">
            <div className="text-xs uppercase tracking-[0.2em] text-pink-200 mb-2">
              Warning
            </div>
            <p className="text-pink-50 font-semibold leading-relaxed">
              Warning: USE ONLY on games with house edge under 1.5% ideally under 1%.
              Every tiny bit higher than 1% adds up QUICK with this strategy.
              
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setShowWarningModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={confirmStartSession}
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
