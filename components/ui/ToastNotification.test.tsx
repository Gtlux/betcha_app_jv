import React from 'react';
import { render, act } from '@testing-library/react-native';
import ToastNotification from './ToastNotification';

jest.useFakeTimers();

describe('ToastNotification', () => {
  const mockOnHide = jest.fn();

  afterEach(() => {
    mockOnHide.mockClear();
  });

  it('turėtų renderinti pranešimo tekstą kai visible=true', () => {
    const { getByText } = render(
      <ToastNotification
        message="Testas sėkmingas!"
        type="success"
        visible={true}
        onHide={mockOnHide}
      />,
    );

    expect(getByText('Testas sėkmingas!')).toBeTruthy();
  });

  it('neturėtų renderinti nieko kai visible=false', () => {
    const { queryByTestId } = render(
      <ToastNotification
        message="Neturi matytis"
        type="error"
        visible={false}
        onHide={mockOnHide}
      />,
    );

    expect(queryByTestId('toast-notification')).toBeNull();
  });

  it('turėtų renderinti success tipo toast su ikona ✅', () => {
    const { getByText } = render(
      <ToastNotification
        message="Sėkmė"
        type="success"
        visible={true}
        onHide={mockOnHide}
      />,
    );

    expect(getByText('✅')).toBeTruthy();
  });

  it('turėtų renderinti error tipo toast su ikona ❌', () => {
    const { getByText } = render(
      <ToastNotification
        message="Klaida"
        type="error"
        visible={true}
        onHide={mockOnHide}
      />,
    );

    expect(getByText('❌')).toBeTruthy();
  });

  it('turėtų renderinti warning tipo toast su ikona ⚠️', () => {
    const { getByText } = render(
      <ToastNotification
        message="Įspėjimas"
        type="warning"
        visible={true}
        onHide={mockOnHide}
      />,
    );

    expect(getByText('⚠️')).toBeTruthy();
  });

  it('turėtų iškviesti onHide po nustatytos trukmės', () => {
    render(
      <ToastNotification
        message="Auto-hide"
        type="success"
        visible={true}
        onHide={mockOnHide}
        duration={3000}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(3300);
    });

    expect(mockOnHide).toHaveBeenCalled();
  });
});
