import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProjects } from '@/store/projects';
import { Video } from 'expo-av';
import { useState, useRef } from 'react';
import { Save } from 'lucide-react-native';

export default function PreviewProjectScreen() {
  const { id } = useLocalSearchParams();
  const { projects } = useProjects();
  const project = projects.find((p) => p.id === id);
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState({});

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const handleExport = async () => {
    // TODO: Implement video export functionality
    // This will require additional processing to combine clips
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewContainer}>
        <Video
          ref={videoRef}
          style={styles.preview}
          source={{ uri: project.clips[0]?.uri }}
          useNativeControls
          resizeMode="contain"
          onPlaybackStatusUpdate={setStatus}
        />
      </View>

      <Pressable style={styles.exportButton} onPress={handleExport}>
        <Save size={24} color="#fff" />
        <Text style={styles.exportText}>Export Project</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: 300,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  exportText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});