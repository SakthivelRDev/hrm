import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
const HEADER_HEIGHT = 46; // compact height

const AppHeader = ({ navigation, back, options, route }) => {
  const title = options.title !== undefined ? options.title : route.name;

  return (
    <View style={[styles.container, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <View style={styles.inner}>
        {back ? (
          <TouchableOpacity style={styles.backWrap} onPress={navigation.goBack} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <View style={styles.rightPlaceholder} />
      </View>
    </View>
  );
};

export const defaultHeaderOptions = {
  header: (props) => <AppHeader {...props} />,
  headerTitleAlign: 'center',
  headerShadowVisible: false,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e2e2',
  },
  inner: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backWrap: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backText: {
    fontSize: 26,
    lineHeight: 26,
    color: '#2196F3',
    fontWeight: '300',
    marginTop: -2,
  },
  backPlaceholder: { width: 40 },
  rightPlaceholder: { width: 40 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
});