import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Project } from '@/store/projects';
import { GestureDetector, Gesture, PanGestureHandlerEventPayload, GestureUpdateEvent } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue,runOnJS ,withSpring} from 'react-native-reanimated';

interface TimeLineProps {
  project: Project;
  selectedTime: number;
  onSelectTime?: (time: number) => void;
  timelineScale: number;
  selectedClip: string | null;
  onSelectClip?: (clipId: string) => void;
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
  // const panGesture = Gesture.Pan()
  //   .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
  //     position.value = Math.max(0, position.value + e.translationX);
  //   })
  //   .onEnd(() => {
  //     const newStartTime = Math.round((position.value / timelineScale) * 1000);
  //     if (onUpdateStartTime) {
  //       onUpdateStartTime(clip.id, newStartTime);
  //     }
  //   });

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
  // const leftHandleGesture = Gesture.Pan()
  //   .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
  //     const newPosition = Math.max(0, position.value + e.translationX);
  //     const newWidth = Math.min(
  //       MAX_DURATION * timelineScale,
  //       Math.max(MIN_DURATION * timelineScale, width.value - e.translationX)
  //     );
      
  //     position.value = newPosition;
  //     width.value = newWidth;
  //   })
  //   .onEnd(() => {
  //     const newStartTime = Math.round((position.value / timelineScale) * 1000);
  //     const newDuration = Math.round((width.value / timelineScale) * 1000);
      
  //     if (onUpdateStartTime && onUpdateDuration) {
  //       onUpdateStartTime(clip.id, newStartTime);
  //       onUpdateDuration(clip.id, newDuration);
  //     }
  //   });
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
      runOnJS(onUpdateDuration)?.(clip.id, Math.round((width.value / timelineScale) * 1000));
      }
    });
  // const rightHandleGesture = Gesture.Pan()
  //   .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
  //     width.value = Math.min(
  //       MAX_DURATION * timelineScale,
  //       Math.max(MIN_DURATION * timelineScale, width.value + e.translationX)
  //     );
  //   })
  //   .onEnd(() => {
  //     const newDuration = Math.round((width.value / timelineScale) * 1000);
  //     if (onUpdateDuration) {
  //       onUpdateDuration(clip.id, newDuration);
  //     }
  //   });
  
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.clip,
          isSelected && styles.selectedClip,
          animatedStyle,
        ]}
      >
        <Pressable 
          style={styles.clipContent}
          onPress={onSelect}
        >
          <Text style={styles.clipText}>{clip.type}</Text>
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
  onSelectClip,
  onUpdateClipStartTime,
  onUpdateClipDuration,
}) => {
  // Sort clips by start time to ensure proper sequencing
  const sortedClips = useMemo(() => {
    return [...project.clips].sort((a, b) => a.startTime - b.startTime);
  }, [project.clips]);

  const videoClips = sortedClips.filter(clip => 
    ['image', 'video'].includes(clip.type)
  );
  
  const audioClips = sortedClips.filter(clip => 
    clip.type === 'audio'
  );

  // Calculate total duration for timeline width
  const totalDuration = project.clips.reduce(
    (acc, clip) => Math.max(acc, clip.startTime + clip.duration), 
    0
  );
  
  // Minimum width to ensure we have space to work with
  const timelineWidth = Math.max(
    totalDuration * timelineScale / 1000,
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
          }
        ]}
      >
        <Text style={styles.timeMarkerText}>
          {formatTime(time)}
        </Text>
      </View>
    );
  }

  // Render a track with clips
  const renderTrack = (trackClips: typeof project.clips, trackTitle: string) => (
    <View style={styles.track}>
      {/* <View style={styles.trackLabel}>
        <Text style={styles.trackLabelText}>{trackTitle}</Text>
      </View> */}
      <View style={styles.trackContent}>
        {trackClips.map(clip => (
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
  );

  // Render the current time position indicator (playhead)
  const renderPlayhead = () => (
    <View 
      style={[
        styles.playhead,
        {
          left: (selectedTime / 1000) * timelineScale,
        }
      ]} 
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.timelineHeader}>
        {timeMarkers}
      </View>
      
      {renderTrack(videoClips, 'Video Track')}
      {renderTrack(audioClips, 'Audio Track')}
      
      {renderPlayhead()}
    </View>
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
    height: '100%',
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
  playhead: {
    position: 'absolute',
    top: 30, // Start below the timeline header
    height: TRACK_HEIGHT * 3, // Cover all tracks
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
});

export default TimeLine;