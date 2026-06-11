import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settings-store';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ showBetNumbers: true });
  });

  it('shows bet numbers by default', () => {
    expect(useSettingsStore.getState().showBetNumbers).toBe(true);
  });

  it('setShowBetNumbers turns bet numbers off', () => {
    useSettingsStore.getState().setShowBetNumbers(false);
    expect(useSettingsStore.getState().showBetNumbers).toBe(false);
  });

  it('setShowBetNumbers turns bet numbers back on', () => {
    useSettingsStore.getState().setShowBetNumbers(false);
    useSettingsStore.getState().setShowBetNumbers(true);
    expect(useSettingsStore.getState().showBetNumbers).toBe(true);
  });

  it('persists under the app-settings key', () => {
    expect(useSettingsStore.persist.getOptions().name).toBe('app-settings:v1');
  });
});
