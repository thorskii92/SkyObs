import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from "react";
import { Button, Text, View } from "react-native";

export default function Index() {
  const [date, setDate] = useState(new Date());

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      onChange: (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setDate(currentDate);
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      Select Date: <Button title="Select Date" onPress={showDatePicker} />
      <Button title="New" onPress={() => alert("Button pressed!")} />
      <Button title="View" onPress={() => alert("Button pressed!")} />
      <Button title="Generate" onPress={() => alert("Button pressed!")} />
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
