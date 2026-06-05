/**
 * Component test — PersonalizationDebugPanel
 * Verifies the panel renders nothing when P13N_DEBUG is disabled.
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../config/personalizationDebug', () => ({ P13N_DEBUG: false }));

jest.mock('../context/PersonalizationContext', () => ({
  usePersonalization: jest.fn()
}));
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

const { usePersonalization } = require('../context/PersonalizationContext');
const { useAuth }            = require('../context/AuthContext');

import PersonalizationDebugPanel from '../components/PersonalizationDebugPanel';

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { _id: 'u1' } });
  usePersonalization.mockReturnValue({
    scenario: null,
    intentScore: { score: 0, tier: 'low' },
    notifications: [],
    debugLog: [],
    sessionId: 'sess_1',
    clearDebugLog: jest.fn(),
    refreshPersonalization: jest.fn()
  });
});

it('renders nothing when P13N_DEBUG is false', () => {
  const { container } = render(<PersonalizationDebugPanel />);
  expect(container).toBeEmptyDOMElement();
});
