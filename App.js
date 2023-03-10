import React, { useEffect, useState, useRef } from 'react';
import { Alert, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

export default function App() {
  const [trainid, setTrainid] = useState('');
  const [trainStops, setTrainStops] = useState([]);
  const [stopCodes, setStopCodes] = useState({});
  const translation = useRef(new Animated.Value(0)).current;
  const fadeinAnim = useRef(new Animated.Value(0)).current;
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch(`https://rata.digitraffic.fi/api/v1/metadata/stations`);
        const json = await response.json();
        const stopCodes = json.reduce((acc, station) => {
          if (station.type === 'STATION') {
            acc[station.stationShortCode] = station.stationName;
          }
          return acc;
        }, {});
        setStopCodes(stopCodes);
        console.log('Stations fetched');
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Cannot find station data");
      }
    };

    fetchStations();
  }, []);

  const fadeinAnimation = () => {
    Animated.timing(fadeinAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const animateTrain = () => {
    const screenWidth = Dimensions.get('screen').width;
    Animated.timing(translation, {
      toValue: screenWidth + 382,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setAnimationDone(true);
      console.log(animationDone);
      fadeinAnimation();
    });
  };


  const fetchTrainData = async () => {
    translation.setValue(0);
    fadeinAnim.setValue(0);
    setTrainStops([]);
    const currentTimeUTC = new Date().toISOString();

    try {
      const response = await fetch(`https://rata.digitraffic.fi/api/v1/trains/latest/${trainid}`);
      const json = await response.json();
      json[0].timeTableRows.filter((row) => {
        if (row.liveEstimateTime > currentTimeUTC && row.commercialStop === true) {
          const timeString = new Date(row.liveEstimateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if(trainStops.some(stop => stop.name === row.stationShortCode)) {
            const index = trainStops.findIndex(stop => stop.name === row.stationShortCode);
            trainStops[index][row.type] = timeString;
            setTrainStops([...trainStops]);
            console.log(index);
          } else {
          setTrainStops((trainStops) => [...trainStops, { name: row.stationShortCode, [row.type]: timeString } ]);
          }
        }
      });
 
      console.log(trainStops);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Cannot find train data");
    }
  };


return (
  <View className="flex-1 bg-green-700">
    <Image className="absolute z-0 w-full h-full"
      source={require('./assets/background.png')}
    />
    <View className="flex-1 justify-center">
      <BlurView tint="dark" intensity={75} className="border-y-4 border-green-600 w-full flex items-center py-6">
      <Text className="text-white text-xl">Enter train number</Text>
      <TextInput className="border-2 border-white rounded-md p-2 text-white text-lg w-1/4 text-center my-6"
        onChangeText={setTrainid}
        onSubmitEditing={() => { fetchTrainData(); animateTrain(); }}
        value={trainid}
        placeholder='123'
        placeholderTextColor={'#fff'}
        keyboardType='numeric'
      />
      <TouchableOpacity className="border border-green-800 px-6 py-2 bg-green-900 rounded-3xl"
        onPress={() => { fetchTrainData(); animateTrain(); }}
      >
        <Text className="text-white text-xl">Search</Text>
      </TouchableOpacity>
      </BlurView>
    </View>
    <Animated.Image className="absolute scale-50 z-10 -left-[382] top-[350]"
      source={require('./assets/train.png')}
      style={{ transform: [{ translateX: translation }] }}
    />
    <Animated.ScrollView className="flex-1 px-10"
    style={{ opacity: fadeinAnim }}
    >
      {animationDone ?
        trainStops.map((stop, index) => {
          return (
            <BlurView intensity={50} tint="dark" className="flex items-center my-3 border-b-2 border-b-green-600" key={index}>
              <Text className="text-white text-2xl basis-2/5 mb-2">{stopCodes[stop.name]}</Text>
              <View className="flex flex-row">
                <Text className="text-white text-xl flex">{stop.ARRIVAL}</Text>
                <Text className="text-white text-xl basis-2/5 text-right">{stop.DEPARTURE}</Text>
              </View>
            </BlurView>
          )
        }
        ) : null
      }
    </Animated.ScrollView>
  </View>
);
}