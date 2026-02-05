import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../global';

export default function SplashScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.container1}>
        <Animatable.View
          animation="bounceIn"
          duration={1500}
          style={styles.logoContainer}
        >
          <Icon
            name="restaurant"
            type="material"
            size={120}
            color="#FF6B35"
            containerStyle={styles.iconContainer}
          />
          <View style={styles.textContainer}>
            <Text style={styles.appName}>Good Food</Text>
            <Text style={styles.appType}>Restaurant</Text>
            <Text style={styles.tagline}>Cuisine & Gestion</Text>
          </View>
        </Animatable.View>
      </View>

      <Animatable.View style={styles.container2} animation="fadeInUpBig">
        <View style={styles.button}>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <LinearGradient
              colors={['#FF6B35', '#F7931E']}
              style={styles.signInButton}
            >
              <Text style={styles.signInText}>Commencer</Text>
              <Icon
                name="navigate-next"
                type="material"
                size={20}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container1: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
    textAlign: 'center',
  },
  appType: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F7931E',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  container2: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  signInText: {
    fontWeight: "bold",
    color: '#FFFFFF',
  },
  signInButton: {
    width: 180,
    height: 50,
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 25,
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  button: {
    alignItems: "flex-end",
    marginTop: 80,
    marginRight: 20,
  }
});
