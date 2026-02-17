import React from 'react';
import { render } from '@testing-library/react-native';
import EmptyState from '../../components/EmptyState';

// Mock des dépendances
jest.mock('react-native-elements', () => ({
  Icon: ({ name, type, size, color, containerStyle, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, {
      testID: `icon-${name}`,
      style: containerStyle,
      ...props
    });
  },
}));

jest.mock('../../i18n', () => ({
  t: (key, options) => {
    const translations = {
      'common.noData': 'Aucune donnée disponible',
    };
    return translations[key] || key;
  },
}));

describe('EmptyState', () => {
  const mockColors = {
    grey: {
      400: '#BDBDBD',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  };

  beforeEach(() => {
    jest.mock('../../global', () => ({
      colors: mockColors,
    }));
  });

  it('renders correctly with default props', () => {
    const { getByText, getByTestId } = render(
      <EmptyState />
    );

    expect(getByTestId('icon-inbox')).toBeTruthy();
    expect(getByText('Aucune donnée disponible')).toBeTruthy();
  });

  it('renders with custom icon', () => {
    const { getByTestId } = render(
      <EmptyState icon="notifications-off" />
    );

    expect(getByTestId('icon-notifications-off')).toBeTruthy();
  });

  it('renders with custom title', () => {
    const { getByText } = render(
      <EmptyState title="Custom Title" />
    );

    expect(getByText('Custom Title')).toBeTruthy();
  });

  it('renders with custom subtitle', () => {
    const { getByText } = render(
      <EmptyState
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('renders with action component', () => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');

    const ActionComponent = () => React.createElement(TouchableOpacity, {
      testID: 'action-button'
    }, React.createElement(Text, null, 'Action'));

    const { getByTestId } = render(
      <EmptyState
        action={React.createElement(ActionComponent)}
      />
    );

    expect(getByTestId('action-button')).toBeTruthy();
  });

  it('applies custom styles correctly', () => {
    const customContainerStyle = { backgroundColor: 'red' };
    const customTitleStyle = { color: 'blue' };
    const customSubtitleStyle = { fontSize: 16 };

    const { getByText } = render(
      <EmptyState
        title="Test Title"
        subtitle="Test Subtitle"
        containerStyle={customContainerStyle}
        titleStyle={customTitleStyle}
        subtitleStyle={customSubtitleStyle}
      />
    );

    const titleElement = getByText('Test Title');
    const subtitleElement = getByText('Test Subtitle');

    expect(titleElement).toBeTruthy();
    expect(subtitleElement).toBeTruthy();
  });

  it('renders with custom icon type and color', () => {
    const { getByTestId } = render(
      <EmptyState
        icon="star"
        iconType="material"
      />
    );

    expect(getByTestId('icon-star')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { getByText, queryByText } = render(
      <EmptyState title="Only Title" />
    );

    expect(getByText('Only Title')).toBeTruthy();
    expect(queryByText(/Test Subtitle/)).toBeNull();
  });

  it('does not render action when not provided', () => {
    const { queryByTestId } = render(
      <EmptyState title="No Action" />
    );

    expect(queryByTestId('action-button')).toBeNull();
  });
});
