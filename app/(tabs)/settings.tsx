import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { useState } from 'react';

export default function SettingsScreen() {
  const [highQuality, setHighQuality] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Settings</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>High Quality Export</Text>
          <Switch
            value={highQuality}
            onValueChange={setHighQuality}
            trackColor={{ false: '#404040', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Editor Settings</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Auto-save Projects</Text>
          <Switch
            value={autoSave}
            onValueChange={setAutoSave}
            trackColor={{ false: '#404040', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Clear Cache</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#404040',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});