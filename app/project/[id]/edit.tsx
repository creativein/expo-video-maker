import TimeLine from '@/app/components/TimeLine';
import { useProjects } from '@/store/projects';
import { Audio, ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { Image, Mic, Pause, Play } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Pressable,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const TRACK_HEIGHT = 80;
const TIMELINE_SCALE = 100; // pixels per second
const CANVAS_ASPECT_RATIO = 16 / 9;

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams();
  const { projects, addClip, updateClip, addLayer, removeLayer } =
    useProjects();
  const project = projects.find((p) => p.id === id);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState(
    project?.layers.find((l) => l.position === 1)?.id
  );
  const timelinePosition = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const videoRef = useRef<Video>(null);
  const lastFrameTime = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const totalDuration = project.clips.reduce(
    (acc, clip) => Math.max(acc, clip.startTime + clip.duration),
    0
  );

  const timelineWidth = (totalDuration * TIMELINE_SCALE) / 1000;

  const playheadStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: timelinePosition.value }],
  }));

  const panGesture = Gesture.Pan().onUpdate((e) => {
    const newPosition = Math.max(0, Math.min(e.absoluteX, timelineWidth));
    timelinePosition.value = withSpring(newPosition);
    // Convert position to time
    const newTime = (newPosition / TIMELINE_SCALE) * 1000;
    setCurrentTime(newTime);
  });

  // Find currently visible clips based on the playhead position (current time)
  const visibleClips = project.clips.filter(
    (clip) =>
      currentTime >= clip.startTime &&
      currentTime < clip.startTime + clip.duration
  );

  const handleTrimStart = (clipId: string) => {
    setSelectedClip(clipId);
  };

  const hanndleAddLayer = () => {
    addLayer(project.id, { position: project.layers.length });
  };

  const handleDeleteLayer = (layerId: number) => {
    removeLayer(project.id, layerId);
    setSelectedLayer(project.layers.find((l) => l.position === 1)?.id);
  };

  const handleSelectClip = (clipId: string) => {
    const layer = project.clips.find((c) => c.id === clipId)?.layerId;
    setSelectedClip(clipId);
    setSelectedLayer(layer);
  };

  const renderTrack = (type: 'video' | 'audio') => {
    const clips = project.clips.filter((clip) =>
      type === 'video'
        ? ['image', 'video'].includes(clip.type)
        : clip.type === 'audio'
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
              onPress={() => handleTrimStart(clip.id)}
            >
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
        layerId: selectedLayer!,
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
        layerId: selectedLayer!,
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
          layerId: selectedLayer!,
        });
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const renderTimeline = () => {
    return (
      <GestureHandlerRootView>
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            style={styles.timeline}
            contentContainerStyle={[
              styles.timelineContent,
              { width: Math.max(timelineWidth, 1000) }, // Ensure minimum width
            ]}
          >
            <GestureDetector gesture={panGesture}>
              <View style={{ width: '100%', height: '100%' }}>
                <Animated.View style={[styles.playhead, playheadStyle]} />
                <TimeLine
                  project={project}
                  selectedTime={currentTime}
                  onSelectTime={setCurrentTime}
                  timelineScale={TIMELINE_SCALE}
                  selectedClip={selectedClip}
                  selectedLayer={selectedLayer!}
                  onDeleteLayer={handleDeleteLayer}
                  onSelectClip={handleSelectClip}
                  onSelectLayer={(layerId) => setSelectedLayer(layerId)}
                  onUpdateClipStartTime={handleUpdateClipStartTime}
                  onUpdateClipDuration={handleUpdateClipDuration}
                />
              </View>
            </GestureDetector>
          </ScrollView>
          <Button title="Add Layer" onPress={hanndleAddLayer} />
        </View>
      </GestureHandlerRootView>
    );
  };

  const renderCanvas = () => {
    const currentClip = isPlaying
      ? visibleClips.length > 0
        ? visibleClips[visibleClips.length - 1] // Show the top-most visible clip
        : null
      : selectedClip
      ? project.clips.find((clip) => clip.id === selectedClip)
      : visibleClips.length > 0
      ? visibleClips[visibleClips.length - 1] // Show the top-most visible clip
      : null;

    return (
      <View style={styles.canvas}>
        {currentClip &&
          ['image', 'video'].includes(currentClip.type) &&
          (currentClip.type === 'image' ? (
            <RNImage
              source={{ uri: currentClip.uri }}
              style={styles.canvasMedia}
              resizeMode="contain"
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: currentClip.uri }}
              style={styles.canvasMedia}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={isPlaying}
            />
          ))}
      </View>
    );
  };

  // Handle Play/Pause
  const togglePlayback = () => {
    setIsPlaying((prevState) => !prevState);

    if (isPlaying) {
      visibleClips.length > 0 &&
        setSelectedClip(visibleClips[visibleClips.length - 1].id);
    }
  };

  // Playback effect
  useEffect(() => {
    if (!project) return;

    // Find the total duration for the project
    const maxDuration = project.clips.reduce(
      (acc, clip) => Math.max(acc, clip.startTime + clip.duration),
      0
    );

    if (isPlaying) {
      // Start the playback animation
      lastFrameTime.current = Date.now();

      const animatePlayhead = () => {
        const now = Date.now();
        const deltaTime = now - lastFrameTime.current;
        lastFrameTime.current = now;

        let newTime = currentTime + deltaTime;

        // Loop back to start if we reach the end
        if (newTime >= maxDuration) {
          newTime = 0;
          // Also update the position immediately to avoid visual glitch
          timelinePosition.value = 0;
          // Scroll back to the beginning of the timeline
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              x: 0,
              animated: false,
            });
          }
        }

        // Update current time and playhead position
        setCurrentTime(newTime);
        timelinePosition.value = withTiming((newTime / 1000) * TIMELINE_SCALE, {
          duration: 100,
        });

        // Ensure the scrollview follows the playhead
        if (scrollViewRef.current) {
          const playheadX = (newTime / 1000) * TIMELINE_SCALE;
          scrollViewRef.current.scrollTo({
            x: Math.max(0, playheadX - 200), // Keep playhead in view
            animated: false,
          });
        }

        // Continue animation loop
        animationFrameId.current = requestAnimationFrame(animatePlayhead);
      };

      animationFrameId.current = requestAnimationFrame(animatePlayhead);
    } else {
      // Stop the animation when paused
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, currentTime, project, timelinePosition, TIMELINE_SCALE]);

  // Handle clip drag to update start time
  const handleUpdateClipStartTime = (clipId: string, newStartTime: number) => {
    const clip = project.clips.find((c) => c.id === clipId);
    if (clip) {
      updateClip(project.id, clipId, {
        ...clip,
        startTime: newStartTime,
      });
    }
  };

  // Handle clip duration update
  const handleUpdateClipDuration = (clipId: string, newDuration: number) => {
    const clip = project.clips.find((c) => c.id === clipId);
    if (clip) {
      updateClip(project.id, clipId, {
        ...clip,
        duration: newDuration,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>{renderCanvas()}</View>
      <View style={styles.timelineContainer}>{renderTimeline()}</View>

      <View style={styles.toolbar}>
        <Pressable style={styles.toolButton} onPress={pickImage}>
          <Image size={24} color="#fff" />
          <Text style={styles.toolText}>Add Image</Text>
        </Pressable>

        {/* <Pressable style={styles.toolButton} onPress={pickVideo}>
          <VideoIcon size={24} color="#fff" />
          <Text style={styles.toolText}>Add Video</Text>
        </Pressable> */}

        <Pressable
          style={[styles.toolButton, recording && styles.toolButtonRecording]}
          onPress={recording ? stopRecording : startRecording}
        >
          <Mic size={24} color="#fff" />
          <Text style={styles.toolText}>
            {recording ? 'Stop Recording' : 'Record Audio'}
          </Text>
        </Pressable>

        {/* {selectedClip && (
          <Pressable
            style={styles.toolButton}
            onPress={() => setSelectedClip(null)}>
            <Scissors size={24} color="#fff" />
            <Text style={styles.toolText}>Trim Clip</Text>
          </Pressable>
        )} */}

        <Pressable style={styles.toolButton} onPress={togglePlayback}>
          {isPlaying ? (
            <Pause size={24} color="#fff" />
          ) : (
            <Play size={24} color="#fff" />
          )}
          <Text style={styles.toolText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </Pressable>
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
    height: 200,
    width: '100%',
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
  timelineMarker: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#fff',
  },
  timelineMarkerText: {
    position: 'absolute',
    top: 10,
    left: -10,
    color: '#fff',
    fontSize: 12,
  },
  canvasContainer: {
    width: '100%',
    aspectRatio: CANVAS_ASPECT_RATIO,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  canvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  canvasMedia: {
    width: '100%',
    height: '100%',
  },
});
