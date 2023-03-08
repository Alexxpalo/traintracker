import React from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';

export default function App() {
  const [fetchedData, setFetchedData] = React.useState([]);
  const [trainid, setTrainid] = React.useState('');
  const [filteredData, setFilteredData] = React.useState([]);

  const fetchTrainData = () => {
    console.log("fetching train data")
    const currentTimeUTC = new Date().toISOString();
    fetch(`https://rata.digitraffic.fi/api/v1/trains/latest/${trainid}`)
      .then((response) => response.json())
      .then((json) => setFetchedData(json[0]))
      .then(() => console.log(fetchedData))
      .then(() => console.log(currentTimeUTC))
      .then(() => {
        const filtered = fetchedData.timeTableRows.filter((row) => {
          return row.liveEstimateTime > currentTimeUTC && row.trainStopping === true;
        });
        setFilteredData(filtered);
      })
      .then(() => console.log(filteredData))
      .catch((error) => console.error(error))
      .finally(() => console.log('done'));
  };

  return (
    <View className="flex-1 items-center justify-center bg-green-700">
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
  );
}