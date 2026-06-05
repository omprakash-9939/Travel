/**
 * Component test — PersonalizationDebugPanel
 * Verifies the panel renders nothing when P13N_DEBUG is disabled.
*/

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonalizationDebugPanel from '../components/PersonalizationDebugPanel';

jest.mock('../config/personalizationDebug', () => ({ P13N_DEBUG: false }));

jest.mock('../context/PersonalizationContext', () => ({
  usePersonalization: jest.fn()
}));
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

const { usePersonalization } = require('../context/PersonalizationContext');
const { useAuth }            = require('../context/AuthContext');


beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { _id: 'u1' } });
  usePersonalization.mockReturnValue({
    scenario: null,
    intentScore: { score: 0, tier: 'low' },
    notifications: [],
    recentActivities: [],
    sessionId: 'sess_1',
    refreshPersonalization: jest.fn()
  });
});

it('renders nothing when P13N_DEBUG is false', () => {
  const { container } = render(<PersonalizationDebugPanel />);
  expect(container).toBeEmptyDOMElement();
});
