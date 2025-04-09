import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const DraggableResizableImage = ({ source, containerSize }) => {

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const aspectRatio =  containerSize.width/containerSize.height
  const width = useSharedValue(containerSize.width);
  const height = useSharedValue(containerSize.width/aspectRatio);

  console.log(containerSize.width)
  const MAX_WIDTH = containerSize.width;
  const MIN_WIDTH = 100;

  let dragOffset = { x: 0, y: 0 };
  const dragGesture = Gesture.Pan()
  .onStart(() => {
    dragOffset.x = translateX.value;
    dragOffset.y = translateY.value;
  })
  .onUpdate((event) => {
    let newX = dragOffset.x + event.translationX;
    let newY = dragOffset.y + event.translationY;

    const maxX = containerSize.width - width.value;
    const maxY = containerSize.height - height.value;

    // Clamp to container bounds
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    translateX.value = newX;
    translateY.value = newY;
  });
  
  const pinchGesture = Gesture.Pinch()
  .onUpdate((event) => {
    let proposedWidth = width.value * event.scale;
    proposedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, proposedWidth));

    const proposedHeight = proposedWidth / aspectRatio;

    const maxWidth = containerSize.width - translateX.value;
    const maxHeight = containerSize.height - translateY.value;

    if (proposedWidth <= maxWidth && proposedHeight <= maxHeight) {
      width.value = proposedWidth;
      height.value = proposedHeight;
    }
  });


  const lastOffset = { width: width.value };

  const resizeGesture = Gesture.Pan()
  .onStart(() => {
    lastOffset.width = width.value;
  })
  .onUpdate((event) => {
    let proposedWidth = lastOffset.width + event.translationX;

    // Clamp between min and max
    proposedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, proposedWidth));

    // Calculate new height from aspect ratio
    const proposedHeight = proposedWidth / aspectRatio;

    // Ensure the resized image fits inside container bounds
    const maxWidth = containerSize.width - translateX.value;
    const maxHeight = containerSize.height - translateY.value;

    if (proposedWidth <= maxWidth && proposedHeight <= maxHeight) {
      width.value = proposedWidth;
      height.value = proposedHeight;
    }
  });




  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const imageStyle = useAnimatedStyle(() => (
    {
    width: width.value,
    height: height.value,
  }));
  
  const combinedGesture = Gesture.Simultaneous(dragGesture, resizeGesture);


  return (
    <View style={styles.container}>
      <GestureDetector gesture={dragGesture}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Animated.Image
            source={{ uri: source }}
            style={imageStyle}
            resizeMode="stretch"
          />
          <GestureDetector gesture={resizeGesture}>
            <View style={styles.resizeHandle} />
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    position: 'absolute',
  },
  resizeHandle: {
    width: 20,
    height: 20,
    backgroundColor: 'blue',
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 10,
  },
});

export default DraggableResizableImage;
