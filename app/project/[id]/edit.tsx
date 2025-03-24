import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProjects } from '@/store/projects';
import { Image, Video, Mic, Scissors } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { useState, useRef } from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withSpring 
} from 'react-native-reanimated';

const TRACK_HEIGHT = 80;
const TIMELINE_SCALE = 100; // pixels per second

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams();
  const { projects, addClip, updateClip } = useProjects();
  const project = projects.find((p) => p.id === id);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const timelinePosition = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const totalDuration = project.clips.reduce((acc, clip) => 
    Math.max(acc, clip.startTime + clip.duration), 0);

  const timelineWidth = totalDuration * TIMELINE_SCALE / 1000;

  const playheadStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: timelinePosition.value }],
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newPosition = Math.max(0, Math.min(e.absoluteX, timelineWidth));
      timelinePosition.value = withSpring(newPosition);
    });

  const handleTrimStart = (clipId: string) => {
    setSelectedClip(clipId);
  };

  const renderTrack = (type: 'video' | 'audio') => {
    const clips = project.clips.filter(clip => 
      type === 'video' ? ['image', 'video'].includes(clip.type) : clip.type === 'audio'
    );

    return (
      <View style={styles.track}>
        <View style={styles.trackLabel}>
          <Text style={styles.trackLabelText}>
            {type === 'video' ? 'Video Track' : 'Audio Track'}
          </Text>
        </View>
        <View style={styles.trackContent}>
          {clips.map((clip) => (
            <Pressable
              key={clip.id}
              style={[
                styles.clip,
                {
                  left: (clip.startTime / 1000) * TIMELINE_SCALE,
                  width: (clip.duration / 1000) * TIMELINE_SCALE,
                },
                selectedClip === clip.id && styles.selectedClip,
              ]}
              onPress={() => handleTrimStart(clip.id)}>
              <View style={styles.clipContent}>
                <Text style={styles.clipType}>{clip.type}</Text>
                {selectedClip === clip.id && (
                  <View style={styles.trimHandles}>
                    <View style={styles.trimHandle} />
                    <View style={styles.trimHandle} />
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      addClip(project.id, {
        type: 'image',
        uri: result.assets[0].uri,
        duration: 5000,
        startTime: totalDuration,
      });
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      addClip(project.id, {
        type: 'video',
        uri: result.assets[0].uri,
        duration: 5000,
        startTime: totalDuration,
      });
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        addClip(project.id, {
          type: 'audio',
          uri,
          duration: 5000,
          startTime: totalDuration,
        });
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timelineContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          style={styles.timeline}
          contentContainerStyle={[
            styles.timelineContent,
            { width: timelineWidth },
          ]}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.playhead, playheadStyle]} />
          </GestureDetector>
          {renderTrack('video')}
          {renderTrack('audio')}
        </ScrollView>
      </View>

      <View style={styles.toolbar}>
        <Pressable style={styles.toolButton} onPress={pickImage}>
          <Image size={24} color="#fff" />
          <Text style={styles.toolText}>Add Image</Text>
        </Pressable>

        <Pressable style={styles.toolButton} onPress={pickVideo}>
          <Video size={24} color="#fff" />
          <Text style={styles.toolText}>Add Video</Text>
        </Pressable>

        <Pressable
          style={[styles.toolButton, recording && styles.toolButtonRecording]}
          onPress={recording ? stopRecording : startRecording}>
          <Mic size={24} color="#fff" />
          <Text style={styles.toolText}>
            {recording ? 'Stop Recording' : 'Record Audio'}
          </Text>
        </Pressable>

        {selectedClip && (
          <Pressable
            style={styles.toolButton}
            onPress={() => setSelectedClip(null)}>
            <Scissors size={24} color="#fff" />
            <Text style={styles.toolText}>Trim Clip</Text>
          </Pressable>
        )}
      </View>
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
  timelineContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    padding: 16,
    paddingTop: 40, // Space for time indicators
  },
  playhead: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#007AFF',
    zIndex: 1000,
  },
  track: {
    height: TRACK_HEIGHT,
    marginBottom: 16,
    flexDirection: 'row',
  },
  trackLabel: {
    width: 100,
    justifyContent: 'center',
    paddingRight: 16,
  },
  trackLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  trackContent: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    position: 'relative',
  },
  clip: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#404040',
    borderRadius: 4,
    padding: 8,
  },
  selectedClip: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  clipContent: {
    flex: 1,
    justifyContent: 'center',
  },
  clipType: {
    color: '#fff',
    fontSize: 12,
  },
  trimHandles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: -2,
    right: -2,
    bottom: -10,
  },
  trimHandle: {
    width: 8,
    height: 16,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  toolButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    minWidth: 100,
  },
  toolButtonRecording: {
    backgroundColor: '#ff3b30',
  },
  toolText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 12,
  },
});