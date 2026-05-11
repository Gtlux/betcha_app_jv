import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SearchBar from './SearchBar';
import { ThemeProvider } from '@shopify/restyle';
import theme from '@/constants/theme';

jest.useFakeTimers();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();

  afterEach(() => {
    mockOnSearch.mockClear();
  });

  it('turėtų renderinti su placeholder tekstu', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} placeholder="Ieškoti..." />,
    );

    expect(getByPlaceholderText('Ieškoti...')).toBeTruthy();
  });

  it('turėtų iškviesti onSearch po 300ms debounce', () => {
    const { getByTestId } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    fireEvent.changeText(getByTestId('search-bar-input'), 'testas');

    // Prieš 300ms — neturi būti iškviesta
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Po 300ms — turi būti iškviesta
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(mockOnSearch).toHaveBeenCalledWith('testas');
  });

  it('turėtų rodyti X mygtuką kai yra tekstas', () => {
    const { getByTestId, queryByTestId } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    // Pradžioje X nematomas
    expect(queryByTestId('search-bar-clear')).toBeNull();

    // Įvedus tekstą — X atsiranda
    fireEvent.changeText(getByTestId('search-bar-input'), 'abc');
    expect(getByTestId('search-bar-clear')).toBeTruthy();
  });

  it('turėtų išvalyti lauką paspaudus X', () => {
    const { getByTestId } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    fireEvent.changeText(getByTestId('search-bar-input'), 'valymas');
    fireEvent.press(getByTestId('search-bar-clear'));

    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('turėtų atšaukti ankstesnį timer prie greito rašymo', () => {
    const { getByTestId } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    fireEvent.changeText(getByTestId('search-bar-input'), 'a');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    fireEvent.changeText(getByTestId('search-bar-input'), 'ab');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    fireEvent.changeText(getByTestId('search-bar-input'), 'abc');

    // Po 300ms nuo paskutinio input — tik vienas callback
    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('abc');
  });
});
