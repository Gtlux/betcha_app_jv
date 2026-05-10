import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import theme from '@/constants/theme';
import QuestCard from './QuestCard';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('QuestCard', () => {
  it("renderina pavadinimą ir status badge'ą", () => {
    const { getByText } = renderWithTheme(
      <QuestCard id="q1" title="Išplauti indus" status="open" onPress={jest.fn()} />,
    );

    expect(getByText('Išplauti indus')).toBeTruthy();
    expect(getByText('ATVIRA')).toBeTruthy();
  });

  it('rodo "TAU PRISKIRTA" kai assignedToMe = true', () => {
    const { getByText } = renderWithTheme(
      <QuestCard id="q1" title="Išplauti indus" status="open" assignedToMe onPress={jest.fn()} />,
    );

    expect(getByText('TAU PRISKIRTA')).toBeTruthy();
  });

  it('nerodo "TAU PRISKIRTA" kai assignedToMe nenustatytas', () => {
    const { queryByText } = renderWithTheme(
      <QuestCard id="q1" title="Išplauti indus" status="open" onPress={jest.fn()} />,
    );

    expect(queryByText('TAU PRISKIRTA')).toBeNull();
  });

  it('paspaudus iškviečia onPress su quest id', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <QuestCard id="q42" title="Test" status="completed" onPress={onPress} />,
    );

    fireEvent.press(getByTestId('quest-card-q42'));
    expect(onPress).toHaveBeenCalledWith('q42');
  });

  it("rodo skirtingus status label'us", () => {
    const { rerender, getByText } = renderWithTheme(
      <QuestCard id="q1" title="A" status="open" onPress={jest.fn()} />,
    );
    expect(getByText('ATVIRA')).toBeTruthy();

    rerender(
      <ThemeProvider theme={theme}>
        <QuestCard id="q1" title="A" status="completed" onPress={jest.fn()} />
      </ThemeProvider>,
    );
    expect(getByText('UŽBAIGTA')).toBeTruthy();

    rerender(
      <ThemeProvider theme={theme}>
        <QuestCard id="q1" title="A" status="rejected" onPress={jest.fn()} />
      </ThemeProvider>,
    );
    expect(getByText('ATMESTA')).toBeTruthy();
  });
});
