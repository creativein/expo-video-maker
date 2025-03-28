import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Project } from '@/store/projects';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

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
  // Each clip instance gets its own hook
  const position = useSharedValue((clip.startTime / 1000) * timelineScale);
  const width = useSharedValue((clip.duration / 1000) * timelineScale);
  
  // Update position when startTime changes from outside
  React.useEffect(() => {
    position.value = (clip.startTime / 1000) * timelineScale;
  }, [clip.startTime, timelineScale]);
  
  // Update width when duration changes from outside
  React.useEffect(() => {
    width.value = (clip.duration / 1000) * timelineScale;
  }, [clip.duration, timelineScale]);
  
  // Animation style for this clip
  const animatedStyle = useAnimatedStyle(() => ({
    left: position.value,
    width: width.value,
  }));
  
  // Drag gesture for moving the entire clip
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Calculate new position, ensuring it doesn't go below 0
      position.value = Math.max(0, position.value + e.changeX);
    })
    .onEnd(() => {
      // Convert position back to time (ms)
      const newStartTime = Math.round((position.value / timelineScale) * 1000);
      
      // Call the update function to save the new start time
      if (onUpdateStartTime) {
        onUpdateStartTime(clip.id, newStartTime);
      }
    });
  
  // Drag gesture for the left handle (changes start time and duration)
  const leftHandleGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Calculate new position and width
      const newPosition = Math.max(0, position.value + e.changeX);
      const newWidth = Math.max(500 / timelineScale, width.value - e.changeX); // Minimum 500ms
      
      // Only update if we're not making the clip too small
      if (newWidth >= 500 / timelineScale) {
        position.value = newPosition;
        width.value = newWidth;
      }
    })
    .onEnd(() => {
      // Convert to time values
      const newStartTime = Math.round((position.value / timelineScale) * 1000);
      const newDuration = Math.round((width.value / timelineScale) * 1000);
      
      // Update both start time and duration
      if (onUpdateStartTime && onUpdateDuration) {
        onUpdateStartTime(clip.id, newStartTime);
        onUpdateDuration(clip.id, newDuration);
      }
    });
  
  // Drag gesture for the right handle (changes only duration)
  const rightHandleGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Calculate new width, ensuring minimum width
      width.value = Math.max(500 / timelineScale, width.value + e.changeX); // Minimum 500ms
    })
    .onEnd(() => {
      // Convert to time value
      const newDuration = Math.round((width.value / timelineScale) * 1000);
      
      // Update the duration
      if (onUpdateDuration) {
        onUpdateDuration(clip.id, newDuration);
      }
    });
  
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
  // Group clips by type (video/image or audio)
  const videoClips = project.clips.filter(clip => 
    ['image', 'video'].includes(clip.type)
  );
  
  const audioClips = project.clips.filter(clip => 
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