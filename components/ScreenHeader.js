import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { colors } from '../global';
import HamburgerButton from './HamburgerButton';
import { useScreenHeaderNav } from '../hooks/useScreenHeaderNav';

function ScreenHeaderView({
  title,
  subtitle = null,
  leftComponent = null,
  rightComponent = null,
  onLeftPress = null,
  showBackButton = false,
  showDrawerMenu = false,
  backButtonColor = colors.black,
  containerStyle = {},
  titleStyle = {},
  subtitleStyle = {},
  centerContainerStyle = {},
}) {
  const renderLeftComponent = () => {
    if (showDrawerMenu) {
      return <HamburgerButton />;
    }
    if (leftComponent) {
      return leftComponent;
    }
    if (showBackButton) {
      return (
        <TouchableOpacity
          onPress={onLeftPress}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" type="material" size={24} color={backButtonColor} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.leftContainer}>{renderLeftComponent()}</View>
      <View style={[styles.centerContainer, centerContainerStyle]}>
        <Text style={[styles.title, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.rightContainer}>{rightComponent}</View>
    </View>
  );
}

function ScreenHeaderAuto(props) {
  const autoNav = useScreenHeaderNav();
  return (
    <ScreenHeaderView
      {...props}
      showDrawerMenu={autoNav.showDrawerMenu}
      showBackButton={autoNav.showBackButton}
      onLeftPress={autoNav.onLeftPress}
    />
  );
}

const ScreenHeader = ({ autoLeftNav = false, ...props }) => {
  if (autoLeftNav) {
    return <ScreenHeaderAuto {...props} />;
  }
  return <ScreenHeaderView {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    alignItems: 'flex-end',
    minWidth: 40,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ScreenHeader;
