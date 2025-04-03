import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';

const image1 = require('../../../assets/images/image-5.jpg');
const image2 = require('../../../assets/images/xyz.png');
const image3 = require('../../../assets/images/image-5.jpg');

const VideoPlayComponent = (currentTime: any) => {
  const [imageInfoList, setImageInfoList] = useState([]);
  const imageInfo = [
    {
      startingTime: 0, // ms
      endingTime: 2000, // ms
      uri: image1,
    },
    {
      startingTime: 2000, // ms
      endingTime: 4000, // ms
      uri: image2,
    },
    {
      startingTime: 4000, // ms
      endingTime: 5000, // ms
      uri: image3,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative', // Container needs to be positioned to layer the images
    },
    image: {
      width: 500, // Adjust to your image width
      height: 500, // Adjust to your image height
      position: 'absolute',
      alignSelf: 'center',
    },
  });

  useEffect(() => {
    filterImageInfoListBasedOnCurrentTime();
  }, [currentTime]);

  function filterImageInfoListBasedOnCurrentTime() {
    const filteredData: any = imageInfo.filter(
      (element: any) =>
        element.startingTime <= currentTime?.currentTime &&
        element.endingTime >= currentTime?.currentTime
    );

    setImageInfoList(filteredData);
  }

  return (
    <View style={styles.container}>
      {imageInfoList.map((element: any, index: number) => (
        <Image
          key={index}
          source={element.uri}
          style={[styles.image]}
          resizeMode="cover"
        />
      ))}
    </View>
  );
};

export default VideoPlayComponent;
