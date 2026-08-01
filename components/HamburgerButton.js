import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { colors } from '../global';

const HamburgerButton = () => {
  const navigation = useNavigation();
  const openDrawer = () => {
    if (typeof navigation.openDrawer === 'function') {
      navigation.openDrawer();
      return;
    }
    navigation.dispatch(DrawerActions.openDrawer());
  };
  return (
    <TouchableOpacity
      onPress={openDrawer}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <Icon name="menu" type="material" size={28} color={colors.black} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});

export default HamburgerButton;
