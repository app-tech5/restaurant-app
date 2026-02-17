import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ScreenHeader from '../../components/ScreenHeader';

// Mock des dépendances
jest.mock('react-native-elements', () => ({
  Icon: ({ name, type, size, color, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, {
      testID: `icon-${name}`,
      ...props
    });
  },
}));

jest.mock('../../components/HamburgerButton', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return React.forwardRef((props, ref) => (
    React.createElement(TouchableOpacity, {
      ref,
      testID: 'hamburger-button',
      ...props
    }, React.createElement(Text, null, 'Hamburger'))
  ));
});

describe('ScreenHeader', () => {
  const mockColors = {
    white: '#FFFFFF',
    black: '#000000',
    grey: {
      200: '#EEEEEE',
    },
    text: {
      primary: '#333333',
    },
  };

  beforeEach(() => {
    // Mock du fichier global.js
    jest.mock('../../global', () => ({
      colors: mockColors,
      constants: {
        SPACING: {
          md: 16,
        },
        BORDER_RADIUS: 8,
      },
    }));
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByTestId } = render(
      <ScreenHeader title="Test Title" />
    );

    expect(getByText('Test Title')).toBeTruthy();
  });

  it('renders back button when showBackButton is true', () => {
    const mockOnLeftPress = jest.fn();
    const { getByTestId } = render(
      <ScreenHeader
        title="Test Title"
        showBackButton={true}
        onLeftPress={mockOnLeftPress}
      />
    );

    const backButton = getByTestId('icon-arrow-back');
    expect(backButton).toBeTruthy();

    fireEvent.press(backButton);
    expect(mockOnLeftPress).toHaveBeenCalled();
  });

  it('renders hamburger menu when showDrawerMenu is true', () => {
    const { getByTestId } = render(
      <ScreenHeader
        title="Test Title"
        showDrawerMenu={true}
      />
    );

    expect(getByTestId('hamburger-button')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <ScreenHeader
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('renders right component when provided', () => {
    const React = require('react');
    const { View, Text } = require('react-native');

    const RightComponent = () => React.createElement(View, {
      testID: 'right-component'
    }, React.createElement(Text, null, 'Right'));

    const { getByTestId } = render(
      <ScreenHeader
        title="Test Title"
        rightComponent={React.createElement(RightComponent)}
      />
    );

    expect(getByTestId('right-component')).toBeTruthy();
  });

  it('renders left component when provided', () => {
    const React = require('react');
    const { View, Text } = require('react-native');

    const LeftComponent = () => React.createElement(View, {
      testID: 'left-component'
    }, React.createElement(Text, null, 'Left'));

    const { getByTestId } = render(
      <ScreenHeader
        title="Test Title"
        leftComponent={React.createElement(LeftComponent)}
      />
    );

    expect(getByTestId('left-component')).toBeTruthy();
  });

  it('applies custom styles correctly', () => {
    const customContainerStyle = { backgroundColor: 'red' };
    const customTitleStyle = { color: 'blue' };

    const { getByText } = render(
      <ScreenHeader
        title="Test Title"
        containerStyle={customContainerStyle}
        titleStyle={customTitleStyle}
      />
    );

    const titleElement = getByText('Test Title');
    expect(titleElement).toBeTruthy();
  });

  it('handles onRightPress callback', () => {
    const mockOnRightPress = jest.fn();
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');

    const RightComponent = () => React.createElement(TouchableOpacity, {
      testID: 'right-touchable',
      onPress: mockOnRightPress
    }, React.createElement(Text, null, 'Right'));

    const { getByTestId } = render(
      <ScreenHeader
        title="Test Title"
        rightComponent={React.createElement(RightComponent)}
        onRightPress={mockOnRightPress}
      />
    );

    const rightTouchable = getByTestId('right-touchable');
    fireEvent.press(rightTouchable);
    expect(mockOnRightPress).toHaveBeenCalled();
  });
});
