import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../global';

const Loading = ({
  size = 'large',
  color = colors.primary,
  text = null,
  fullScreen = false,
  containerStyle = {},
  textStyle = {}
}) => {
  const content = (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={[styles.text, { color }, textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Loading;
