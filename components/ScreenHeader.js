import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { colors } from '../global';
import HamburgerButton from './HamburgerButton';

const ScreenHeader = ({
  title,
  subtitle = null,
  leftComponent = null,
  rightComponent = null,
  onLeftPress = null,
  onRightPress = null,
  showBackButton = false,
  backButtonColor = colors.black,
  containerStyle = {},
  titleStyle = {},
  subtitleStyle = {},
  centerContainerStyle = {},
  showDrawerMenu = false,
}) => {
  const renderLeftComponent = () => {

    if (showDrawerMenu) {
      return (
        <HamburgerButton />
      )
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
        >
          <Icon
            name="arrow-back"
            type="material"
            size={24}
            color={backButtonColor}
          />
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderRightComponent = () => {
    if (rightComponent) {
      return (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.leftContainer}>
        {renderLeftComponent()}
      </View>

      <View style={[styles.centerContainer, centerContainerStyle]}>
        <Text style={[styles.title, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {renderRightComponent()}
      </View>
    </View>
  );
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
    // width: 40,
    alignItems: 'flex-end',
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
