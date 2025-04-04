import { Project } from '@/store/projects';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface TimeLineProps {
  project: Project;
  selectedTime: number;
  onSelectTime?: (time: number) => void;
  timelineScale: number;
  selectedClip: string | null;
  selectedLayer: number;
  onDeleteLayer: (layerId: number) => void;
  onSelectClip?: (clipId: string) => void;
  onSelectLayer: (layerId: number) => void;
  onUpdateClipStartTime?: (clipId: string, newStartTime: number) => void;
  onUpdateClipDuration?: (clipId: string, newDuration: number) => void;
}

// Create a separate clip component to properly handle hooks per clip
const TimelineClip = ({
  clip,
  timelineScale,
  isSelected,
  onSelect,
  onUpdateStartTime,
  onUpdateDuration,
}: {
  clip: Project['clips'][0];
  timelineScale: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateStartTime?: (clipId: string, newStartTime: number) => void;
  onUpdateDuration?: (clipId: string, newDuration: number) => void;
}) => {
  const position = useSharedValue((clip.startTime / 1000) * timelineScale);
  const width = useSharedValue((clip.duration / 1000) * timelineScale);

  // Constants for duration constraints
  const MIN_DURATION = 0; // Minimum duration in seconds
  const MAX_DURATION = 112; // Maximum duration in seconds

  React.useEffect(() => {
    position.value = (clip.startTime / 1000) * timelineScale;
  }, [clip.startTime, timelineScale]);

  React.useEffect(() => {
    width.value = (clip.duration / 1000) * timelineScale;
  }, [clip.duration, timelineScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    left: position.value,
    width: width.value,
  }));
  const panGesture = Gesture.Pan()
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      position.value = withSpring(
        Math.max(0, position.value + e.translationX),
        { damping: 15, stiffness: 150 }
      );
    })
    .onEnd(() => {
      const newStartTime = Math.round((position.value / timelineScale) * 1000);
      if (onUpdateStartTime) {
        runOnJS(onUpdateStartTime)(clip.id, newStartTime);
      }
    });

  const leftHandleGesture = Gesture.Pan()
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      const newPosition = Math.max(0, position.value + e.translationX);
      const newWidth = Math.min(
        MAX_DURATION * timelineScale,
        Math.max(MIN_DURATION * timelineScale, width.value - e.translationX)
      );

      position.value = withSpring(newPosition, { damping: 15, stiffness: 150 });
      width.value = withSpring(newWidth, { damping: 15, stiffness: 150 });
    })
    .onEnd(() => {
      const newStartTime = Math.round((position.value / timelineScale) * 1000);
      const newDuration = Math.round((width.value / timelineScale) * 1000);

      if (onUpdateStartTime && onUpdateDuration) {
        runOnJS(onUpdateStartTime)(clip.id, newStartTime);
        runOnJS(onUpdateDuration)(clip.id, newDuration);
      }
    });

  const rightHandleGesture = Gesture.Pan()
    .onUpdate((e) => {
      width.value = withSpring(
        Math.min(
          MAX_DURATION * timelineScale,
          Math.max(MIN_DURATION * timelineScale, width.value + e.translationX)
        ),
        { damping: 15, stiffness: 150 }
      );
    })
    .onEnd(() => {
      if (onUpdateDuration) {
        runOnJS(onUpdateDuration)?.(
          clip.id,
          Math.round((width.value / timelineScale) * 1000)
        );
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.clip, isSelected && styles.selectedClip, animatedStyle]}
      >
        <Pressable style={styles.clipContent} onPress={onSelect}>
          <View style={styles.clipImageContainer}>
            <Image style={styles.clipImage} source={{ uri: clip.uri }} />
          </View>
        </Pressable>

        {isSelected && (
          <>
            <GestureDetector gesture={leftHandleGesture}>
              <View style={[styles.resizeHandle, styles.leftHandle]} />
            </GestureDetector>

            <GestureDetector gesture={rightHandleGesture}>
              <View style={[styles.resizeHandle, styles.rightHandle]} />
            </GestureDetector>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const TRACK_HEIGHT = 80;

const TimeLine: React.FC<TimeLineProps> = ({
  project,
  selectedTime,
  onSelectTime,
  timelineScale,
  selectedClip,
  selectedLayer,
  onDeleteLayer,
  onSelectClip,
  onSelectLayer,
  onUpdateClipStartTime,
  onUpdateClipDuration,
}) => {
  const [deleteLayerId, setDeleteLayerId] = useState<number | null>(null);
  const [deleteLayerMenuVisible, setDeleteLayerMenuVisible] = useState(false);
  const [deleteLayerMenuPosition, setDeleteLayerMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  // Sort clips by start time to ensure proper sequencing
  const sortedClips = useMemo(() => {
    return [...project.clips].sort((a, b) => a.startTime - b.startTime);
  }, [project.clips]);

  const videoClips = sortedClips.filter((clip) =>
    ['image', 'video'].includes(clip.type)
  );

  const audioClips = sortedClips.filter((clip) => clip.type === 'audio');

  // Calculate total duration for timeline width
  const totalDuration = project.clips.reduce(
    (acc, clip) => Math.max(acc, clip.startTime + clip.duration),
    0
  );

  // Minimum width to ensure we have space to work with
  const timelineWidth = Math.max(
    (totalDuration * timelineScale) / 1000,
    1000 // Minimum width of 1000px
  );

  // Generate time markers (every second)
  const timeMarkers = [];
  const markerInterval = 1000; // 1 second
  const numMarkers = Math.ceil(totalDuration / markerInterval) + 1;

  for (let i = 0; i < numMarkers; i++) {
    const time = i * markerInterval;
    timeMarkers.push(
      <View
        key={`marker-${i}`}
        style={[
          styles.timeMarker,
          {
            left: (time / 1000) * timelineScale,
          },
        ]}
      >
        <Text style={styles.timeMarkerText}>{formatTime(time)}</Text>
      </View>
    );
  }

  // Render a track with clips
  const renderTrack = (
    trackClips: typeof project.clips,
    trackTitle: string,
    layerId: number
  ) => {
    return (
      <Pressable
        style={
          selectedLayer === layerId
            ? { ...styles.track, ...styles.selectedTrack }
            : styles.track
        }
        onPress={onSelectLayer.bind(this, layerId)}
        onLongPress={(e) => {
          if (project.layers.length >= 2) {
            setDeleteLayerId(layerId);
            setDeleteLayerMenuPosition({
              x: e.nativeEvent.pageX,
              y: e.nativeEvent.pageY,
            });
            setDeleteLayerMenuVisible(true);
          }
        }}
        key={layerId}
      >
        <View style={styles.track}>
          <View style={styles.trackContent}>
            {trackClips.length > 0 &&
              trackClips.map((clip) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  timelineScale={timelineScale}
                  isSelected={selectedClip === clip.id}
                  onSelect={() => onSelectClip?.(clip.id)}
                  onUpdateStartTime={onUpdateClipStartTime}
                  onUpdateDuration={onUpdateClipDuration}
                />
              ))}
          </View>
        </View>
      </Pressable>
    );
  };

  // Render the current time position indicator (playhead)
  const renderPlayhead = () => (
    <View
      style={[
        styles.playhead,
        {
          left: (selectedTime / 1000) * timelineScale,
          height:
            TRACK_HEIGHT * project.layers.length +
            (12 * project.layers.length - 1),
        },
      ]}
    />
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.timelineHeader}>{timeMarkers}</View>

      {project.layers.map((layer) =>
        renderTrack(
          project.clips.filter((clip) => clip.layerId === layer.id),
          'Video Track',
          layer.id
        )
      )}

      {/* {renderTrack(audioClips, 'Audio Track')} */}

      {renderPlayhead()}

      {deleteLayerId && deleteLayerMenuVisible && (
        <DeleteLayerMenu
          position={deleteLayerMenuPosition}
          onClose={() => setDeleteLayerMenuVisible(false)}
          onDeleteLayer={onDeleteLayer.bind(this, deleteLayerId)}
        />
      )}
    </ScrollView>
  );
};

const DeleteLayerMenu = ({
  position,
  onClose,
  onDeleteLayer,
}: {
  position: { x: number; y: number };
  onClose: () => void;
  onDeleteLayer: () => void;
}) => {
  return (
    <Modal visible={true} transparent={true} onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalBackground}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.menuContainer, { top: position.y, left: position.x }]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              onDeleteLayer();
            }}
          >
            <Text>Delete Layer</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Helper to format time in mm:ss format
const formatTime = (timeMs: number) => {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  timelineHeader: {
    height: 30,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timeMarker: {
    position: 'absolute',
    height: 10,
    width: 1,
    bottom: 0,
    backgroundColor: '#666',
  },
  timeMarkerText: {
    position: 'absolute',
    top: -15,
    color: '#fff',
    fontSize: 10,
    transform: [{ translateX: -10 }],
  },
  track: {
    height: TRACK_HEIGHT,
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#696969',
  },
  selectedTrack: {
    borderWidth: 1,
    borderColor: 'red',
  },
  trackLabel: {
    width: 100,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  trackLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  trackContent: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    position: 'relative',
  },
  clip: {
    position: 'absolute',
    height: '95%',
    backgroundColor: '#3a3a3a',
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
  clipText: {
    color: '#fff',
    fontSize: 10,
  },
  clipImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  clipImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'repeat',
  },
  playhead: {
    position: 'absolute',
    top: 30, // Start below the timeline header
    width: 2,
    backgroundColor: '#ff3b30',
    zIndex: 1000,
  },
  resizeHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: '#007AFF',
    zIndex: 1000,
  },
  leftHandle: {
    left: -5,
  },
  rightHandle: {
    right: -5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    padding: 10,
  },
});

export default TimeLine;
