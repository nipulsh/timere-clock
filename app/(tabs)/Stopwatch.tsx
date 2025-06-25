import React, { useEffect, useRef, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const formatTime = (time: number) => {
  const mins = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const secs = (time % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const Stopwatch = () => {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const reset = () => {
    setRunning(false);
    setTime(0);
    setLaps([]);
  };

  const addLap = () => {
    setLaps((prev) => [formatTime(time), ...prev]);
  };

  return (
    <View className="flex-1 bg-black p-6">
      <View className="items-center mt-20 mb-10">
        <Text className="text-6xl text-lime-400 font-bold">
          {formatTime(time)}
        </Text>
      </View>

      <View className="flex-row justify-center gap-4 space-x-4 mb-6">
        <TouchableOpacity
          className="bg-lime-500 px-6 py-3 rounded-full"
          onPress={() => setRunning((prev) => !prev)}
        >
          <Text className="text-white font-semibold text-lg">
            {running ? "Pause" : "Start"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-full"
          onPress={addLap}
          disabled={!running}
        >
          <Text className="text-white font-semibold text-lg">Lap</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 px-6 py-3 rounded-full"
          onPress={reset}
        >
          <Text className="text-white font-semibold text-lg">Reset</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={laps}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View className="flex-row justify-between mb-2 px-4">
            <Text className="text-white">Lap {laps.length - index}</Text>
            <Text className="text-gray-300">{item}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-4">No laps yet</Text>
        }
      />
    </View>
  );
};

export default Stopwatch;
