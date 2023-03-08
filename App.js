import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';

export default function App() {
  const [fetchedData, setFetchedData] = useState([]);
  const [trainid, setTrainid] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [trainStops, setTrainStops] = useState([]);
  const [stopCodes, setStopCodes] = useState({});

  useEffect(() => {
    fetch(`https://rata.digitraffic.fi/api/v1/metadata/stations`)
      .then((response) => response.json())
      .then((json) => {
        const stopCodes = json.reduce((acc, station) => {
          if (station.type === 'STATION') {
            acc[station.stationShortCode] = station.stationName;
          }
          return acc;
        }, {});
        setStopCodes(stopCodes);
      })
      .then (() => console.log(stopCodes))
      .catch((error) => console.error(error))
      .finally(() => console.log('done'));
  }, []);

  const fetchTrainData = () => {
    setTrainStops([]);
    console.log("fetching train data")
    const currentTimeUTC = new Date().toISOString();
    fetch(`https://rata.digitraffic.fi/api/v1/trains/latest/${trainid}`)
      .then((response) => response.json())
      .then((json) => setFetchedData(json[0]))
      .then(() => {
        const filtered = fetchedData.timeTableRows.filter((row) => {
          if (row.liveEstimateTime > currentTimeUTC && row.trainStopping === true) {
            const timeString = new Date(row.liveEstimateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setTrainStops((trainStops) => [...trainStops, [row.stationShortCode, row.type, timeString]]);
          }
          return row.liveEstimateTime > currentTimeUTC && row.trainStopping === true;
        });
        setFilteredData(filtered);
      })
      .then(() => console.log(trainStops))
      .catch((error) => console.error(error))
      .finally(() => console.log('done'));
  };

  return (
    <View className="flex-1 bg-green-700">
      <View className="flex-1 items-center justify-center">
      <Text className="text-white text-xl">Enter train number</Text>
      <TextInput className="border-2 border-white rounded-md p-2 text-white text-lg w-1/4 text-center my-6"
      onChangeText={setTrainid}
      value={trainid}
      placeholder='123'
      keyboardType='numeric'
      />
      <TouchableOpacity className="border border-green-800 px-6 py-2 bg-green-900 rounded-3xl"
      onPress={fetchTrainData}
      >
        <Text className="text-white text-xl">Search</Text>
      </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-10">
      {
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
          )
        }
        </ScrollView>
    </View>
  );
}