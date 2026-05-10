import React from 'react';
import { render } from '@testing-library/react-native';
import ProfilePanel from './ProfilePanel';
import { ThemeProvider } from '@shopify/restyle';
import theme from '@/constants/theme';

const mockProfile = {
  username: 'Testuotojas',
  avatarUrl: undefined,
  balance: 1500,
  totalPoints: 1000, // 1000 XP yra Smaragdinis
};

describe('ProfilePanel', () => {
  it('turėtų teisingai rodyti vartotojo vardą ir taškus', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <ProfilePanel {...mockProfile} />
      </ThemeProvider>,
    );

    expect(getByText('Testuotojas')).toBeTruthy();
    expect(getByText('1500 🪙')).toBeTruthy();
    expect(getByText('1000 XP')).toBeTruthy();
  });

  it('turėtų rodyti teisingą lygio pavadinimą', () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <ProfilePanel {...mockProfile} />
      </ThemeProvider>,
    );

    expect(getByText('Smaragdinis lygis')).toBeTruthy();
  });

  it('turėtų rodyti teisingą progresijos procentą', () => {
    // 1000 XP yra Smaragdinis, kitas lygis yra Rubininis (2000).
    // Progresas yra 0% nes tiksliai Smaragdinis.
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <ProfilePanel {...mockProfile} />
      </ThemeProvider>,
    );

    expect(getByText('0%')).toBeTruthy();
  });
});
