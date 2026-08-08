import { useMemo } from 'react';
import { useNavigation, useNavigationState, useIsFocused, StackActions } from '@react-navigation/native';

/**
 * Left header action for screens inside the drawer:
 * - stack/drawer root → hamburger (open drawer)
 * - nested stack screen → pop() the stack only (never drawer goBack)
 *
 * navigation.goBack() is unsafe here: after the leaf is popped, a second
 * goBack (or a bubbled one) leaves the drawer and lands on Dashboard.
 */
export function useScreenHeaderNav() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  // Primitive return — object literals from the selector re-trigger every render.
  const mode = useNavigationState((state) => {
    if (!state) return 'none';
    if (state.type === 'drawer') return 'drawer';
    if (state.type === 'stack') return state.index > 0 ? 'back' : 'drawer';
    return state.index > 0 ? 'back' : 'none';
  });

  return useMemo(() => {
    if (!isFocused) {
      return {
        showDrawerMenu: false,
        showBackButton: false,
        onLeftPress: undefined,
      };
    }

    if (mode === 'drawer') {
      return {
        showDrawerMenu: true,
        showBackButton: false,
        onLeftPress: undefined,
      };
    }

    if (mode === 'back') {
      return {
        showDrawerMenu: false,
        showBackButton: true,
        onLeftPress: () => {
          const state = navigation.getState?.();
          if (state?.type === 'stack' && state.index > 0) {
            navigation.dispatch(StackActions.pop(1));
            return;
          }
          if (typeof navigation.pop === 'function') {
            navigation.pop(1);
          }
        },
      };
    }

    return {
      showDrawerMenu: false,
      showBackButton: false,
      onLeftPress: undefined,
    };
  }, [isFocused, mode, navigation]);
}

export default useScreenHeaderNav;
