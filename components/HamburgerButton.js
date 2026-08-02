import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { colors } from '../global';
import i18n from '../i18n';

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
      accessibilityLabel={i18n.t('common.openMenu')}
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
