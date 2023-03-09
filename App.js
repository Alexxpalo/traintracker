import React, { useEffect, useState, useRef } from 'react';
import { ImageBackground, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Animated, Dimensions } from 'react-native';

export default function App() {
  const [fetchedData, setFetchedData] = useState([]);
  const [trainid, setTrainid] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [trainStops, setTrainStops] = useState([]);
  const [stopCodes, setStopCodes] = useState({});
  const translation = useRef(new Animated.Value(0)).current;
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
      }
    };

    fetchStations();
  }, []);

  const animateTrain = () => {
    setAnimationDone(false);
    const screenWidth = Dimensions.get('screen').width;
    Animated.timing(translation, {
      toValue: screenWidth + 382,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setAnimationDone(true);
      console.log(animationDone);
    });
  };


  const fetchTrainData = async () => {
    translation.setValue(0);
    setTrainStops([]);
    const currentTimeUTC = new Date().toISOString();

    try {
      const response = await fetch(`https://rata.digitraffic.fi/api/v1/trains/latest/${trainid}`);
      const json = await response.json();
      setFetchedData(json[0]);
      const filteredData = json[0].timeTableRows.filter((row) => {
        if (row.liveEstimateTime > currentTimeUTC && row.trainStopping === true) {
          const timeString = new Date(row.liveEstimateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setTrainStops((trainStops) => [...trainStops, [row.stationShortCode, row.type, timeString]]);
        }
        return row.liveEstimateTime && row.liveEstimateTime > currentTimeUTC;
      });
      setFilteredData(filteredData);
    } catch (error) {
      console.error(error);
    }
  };


return (
  <View className="flex-1 bg-green-700">
    <Image className="absolute z-0 w-full h-full"
      source={require('./assets/background.png')}
    />
    <View className="flex-1 items-center justify-center">
      <Text className="text-white text-xl">Enter train number</Text>
      <TextInput className="border-2 border-white rounded-md p-2 text-white text-lg w-1/4 text-center my-6"
        onChangeText={setTrainid}
        value={trainid}
        placeholder='123'
        keyboardType='numeric'
      />
      <TouchableOpacity className="border border-green-800 px-6 py-2 bg-green-900 rounded-3xl"
        onPress={() => { fetchTrainData(); animateTrain(); }}
      >
        <Text className="text-white text-xl">Search</Text>
      </TouchableOpacity>
    </View>
    <Animated.Image className="absolute scale-50 z-10 -left-[382] top-[350]"
      source={require('./assets/train.png')}
      style={{ transform: [{ translateX: translation }] }}
    />
    <ScrollView className="flex-1 px-10">
      {animationDone ?
        trainStops.map((stop, index) => {
          return (
            <View className="flex items-center my-3 border-b-2 border-b-green-400" key={index}>
              <Text className="text-white text-2xl basis-2/5 mb-2">{stopCodes[stop[0]]}</Text>
              <View className="flex flex-row">
                <Text className="text-white text-xl flex">{stop[2]}</Text>
                <Text className="text-white text-xl basis-2/5 text-right">{stop[1]}</Text>
              </View>
            </View>
          )
        }
        ) : null
      }
    </ScrollView>
  </View>
);
}