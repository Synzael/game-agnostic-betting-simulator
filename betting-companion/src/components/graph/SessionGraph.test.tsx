import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionGraph } from './SessionGraph';
import { BetRecord, SessionEvent } from '@/engine/types';

const bets: BetRecord[] = [
  { round: 1, timestamp: 1, ladder: 0, index: 0, stake: 10, won: true, pnlAfter: 10 },
  { round: 2, timestamp: 2, ladder: 0, index: 0, stake: 10, won: false, pnlAfter: 0 },
];

const events: SessionEvent[] = [
  {
    round: 2,
    timestamp: 2,
    type: 'write_off',
    pnlAt: 0,
    fromLadder: 1,
    toLadder: 0,
  },
];

describe('SessionGraph', () => {
  it('renders stake labels when showBetNumbers is on', () => {
    render(<SessionGraph betHistory={bets} showBetNumbers={true} />);
    expect(screen.getAllByTestId('stake-label').length).toBe(2);
  });

  it('hides stake labels when showBetNumbers is off', () => {
    render(<SessionGraph betHistory={bets} showBetNumbers={false} />);
    expect(screen.queryByTestId('stake-label')).toBeNull();
  });

  it('renders event and terminal markers', () => {
    render(
      <SessionGraph
        betHistory={bets}
        events={events}
        stopReason="stop_loss"
        showBetNumbers={false}
      />
    );
    expect(screen.getByTestId('event-write_off')).toBeDefined();
    expect(screen.getByTestId('terminal-stop_loss')).toBeDefined();
  });

  it('renders an empty state with no session data', () => {
    render(<SessionGraph betHistory={[]} showBetNumbers={true} />);
    expect(screen.getByText('No bets yet')).toBeDefined();
  });
});
