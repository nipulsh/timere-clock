import { tasks } from "@/constants/tasks";
import usePost from "@/hooks/usePost";
import DateTimePickerModal from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { nanoid } from "nanoid";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "react-native-get-random-values";

const { width } = Dimensions.get("window");
const colors = [
  "#FF6B6B",
  "#6BCB77",
  "#4D96FF",
  "#FFD93D",
  "#6A0572",
  "#FF914D",
  "#00A8E8",
  "#ADFF2F",
  "#FF69B4",
  "#A0522D",
];

const Create = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    start: new Date(),
    end: new Date(),
    color: colors[0],
    timer: {
      id: "",
      isRunning: false,
      secondsLeft: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      timesStopped: 0,
      initialSeconds: 0,
      initialHours: 0,
      initialMinutes: 0,
    },
    tasks: [] as tasks,
  });

  const { saveTimer, loading: saveLoading } = usePost();

  const [taskInput, setTaskInput] = useState("");
  const [durationDaysInput, setDurationDaysInput] = useState("");
  const [resetIntervalsInput, setResetIntervalsInput] = useState("");
  const [dateSelectionMode, setDateSelectionMode] = useState("duration"); // "duration" or "exact"
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

  function generateRandomNumber() {
    return nanoid(10);
  }

  // Calculate start and end dates based on duration
  const calculateDates = (days: number) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const handleDurationChange = (inputValue: string) => {
    setDurationDaysInput(inputValue);

    const days = parseInt(inputValue) || 0;
    if (days > 0) {
      const { start, end } = calculateDates(days);
      setForm({ ...form, start, end });
    }
  };

  const handleStartDateChange = (date: Date) => {
    setStartDatePickerVisible(false);
    setForm({ ...form, start: date });
  };

  const handleEndDateChange = (date: Date) => {
    setEndDatePickerVisible(false);
    setForm({ ...form, end: date });
  };

  const handleDateModeChange = (mode: string) => {
    setDateSelectionMode(mode);
    if (mode === "duration") {
      // Reset to duration-based calculation if we have duration input
      const days = parseInt(durationDaysInput) || 0;
      if (days > 0) {
        const { start, end } = calculateDates(days);
        setForm({ ...form, start, end });
      }
    }
    // If switching to exact mode, keep current dates
  };

  const handleAddTask = () => {
    if (taskInput.trim() === "") {
      Alert.alert("Error", "Please enter a task");
      return;
    }

    const singleTask = {
      id: generateRandomNumber(),
      task: taskInput.trim(),
      completed: false,
    };

    if (form.tasks.some((task) => task.task === singleTask.task)) {
      Alert.alert("Error", "Task already exists");
      return;
    }

    setForm({ ...form, tasks: [...form.tasks, singleTask] });
    setTaskInput("");
  };

  const handleIntervalReset = (inputValue: string) => {
    setResetIntervalsInput(inputValue);
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = form.tasks.filter((_, i) => i !== index);
    setForm({ ...form, tasks: newTasks });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    // Validation for duration mode
    if (dateSelectionMode === "duration") {
      const durationDays = parseInt(durationDaysInput) || 0;
      if (durationDays <= 0) {
        Alert.alert("Error", "Duration must be at least 1 day");
        return;
      }
    }

    // Validation for exact date mode
    if (dateSelectionMode === "exact") {
      if (form.start >= form.end) {
        Alert.alert("Error", "End date must be after start date");
        return;
      }
    }

    if (form.timer.hoursLeft < 0 || form.timer.hoursLeft > 23) {
      Alert.alert("Error", "Hours must be between 0 and 23");
      return;
    }

    if (form.timer.minutesLeft < 0 || form.timer.minutesLeft > 59) {
      Alert.alert("Error", "Minutes must be between 0 and 59");
      return;
    }

    if (form.timer.hoursLeft === 0 && form.timer.minutesLeft === 0) {
      Alert.alert("Error", "Please set a timer duration");
      return;
    }

    try {
      const durationDays =
        dateSelectionMode === "duration"
          ? parseInt(durationDaysInput) || 0
          : Math.ceil(
              (form.end.getTime() - form.start.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1;

      const resetIntervals = parseInt(resetIntervalsInput) || 0;

      const newSlot = {
        ...form,
        id: generateRandomNumber(),
        timer: { ...form.timer, id: generateRandomNumber() },
        dateCreated: new Date().toISOString(),
        resetIntervals: resetIntervals,
        durationDays: durationDays,
        color_theme: form.color, // Add this line to satisfy the timeSlot type
      };

      // Save the timer and wait for completion
      const success = await saveTimer(newSlot);

      if (success) {
        Alert.alert("Success", "Time Slot created successfully!", [
          {
            text: "OK",
            onPress: () => {
              console.log("TimeSlot created:", newSlot);
              // Reset form
              setForm({
                title: "",
                description: "",
                start: new Date(),
                end: new Date(),
                color: colors[0],
                timer: {
                  id: "",
                  isRunning: false,
                  secondsLeft: 0,
                  hoursLeft: 0,
                  minutesLeft: 0,
                  timesStopped: 0,
                  initialSeconds: 0,
                  initialHours: 0,
                  initialMinutes: 0,
                },
                tasks: [],
              });
              setTaskInput("");
              setDurationDaysInput("");
              setResetIntervalsInput("");
              setDateSelectionMode("duration");

              // Navigate back to home - this will trigger useFocusEffect
              router.push("/");
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to create timer. Please try again.");
      }
    } catch (error) {
      console.error("Error saving timer:", error);
      Alert.alert("Error", "An error occurred while creating the timer.");
    }
  };

  const formatDateRange = () => {
    const startStr = form.start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const endStr = form.end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <ScrollView className="bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 px-5 pb-5 border-b border-gray-200 shadow-sm">
        <Text className="text-3xl font-bold text-gray-800 text-center">
          Create Time Slot
        </Text>
      </View>

      <View className="p-5">
        {/* Basic Information Card */}
        <View className="bg-white rounded-xl p-5 mb-5 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Basic Information
          </Text>

          {/* Title */}
          <Text className="mb-2 text-base text-gray-600 font-medium">
            Title *
          </Text>
          <TextInput
            placeholder="Enter a descriptive title"
            className="border border-gray-300 p-3 rounded-lg mb-4 text-base bg-white"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />

          {/* Description */}
          <Text className="mb-2 text-base text-gray-600 font-medium">
            Description
          </Text>
          <TextInput
            placeholder="Add a description (optional)"
            className="border border-gray-300 p-3 rounded-lg mb-4 text-base bg-white h-20"
            multiline
            textAlignVertical="top"
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
          />
        </View>

        {/* Schedule Card */}
        <View className="bg-white rounded-xl p-5 mb-5 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Schedule
          </Text>

          {/* Date Selection Mode */}
          <Text className="mb-3 text-base text-gray-600 font-medium">
            How would you like to set the dates? *
          </Text>
          <View className="flex-row mb-4">
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg mr-2 border ${
                dateSelectionMode === "duration"
                  ? "bg-blue-100 border-blue-500"
                  : "bg-gray-50 border-gray-300"
              }`}
              onPress={() => handleDateModeChange("duration")}
            >
              <Text
                className={`text-center font-medium ${
                  dateSelectionMode === "duration"
                    ? "text-blue-700"
                    : "text-gray-600"
                }`}
              >
                By Duration
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 p-3 rounded-lg ml-2 border ${
                dateSelectionMode === "exact"
                  ? "bg-blue-100 border-blue-500"
                  : "bg-gray-50 border-gray-300"
              }`}
              onPress={() => handleDateModeChange("exact")}
            >
              <Text
                className={`text-center font-medium ${
                  dateSelectionMode === "exact"
                    ? "text-blue-700"
                    : "text-gray-600"
                }`}
              >
                Exact Dates
              </Text>
            </TouchableOpacity>
          </View>

          {/* Duration Mode */}
          {dateSelectionMode === "duration" && (
            <>
              <Text className="mb-2 text-base text-gray-600 font-medium">
                Number of Days *
              </Text>
              <TextInput
                placeholder="Enter number of days (e.g., 40)"
                className="border border-gray-300 p-3 rounded-lg mb-4 text-base bg-white"
                keyboardType="numeric"
                value={durationDaysInput}
                onChangeText={handleDurationChange}
              />
            </>
          )}

          {/* Exact Date Mode */}
          {dateSelectionMode === "exact" && (
            <>
              <View className="mb-4">
                <Text className="mb-2 text-base text-gray-600 font-medium">
                  Start Date *
                </Text>
                <TouchableOpacity
                  className="border border-gray-300 p-3 rounded-lg bg-white"
                  onPress={() => setStartDatePickerVisible(true)}
                >
                  <Text className="text-base text-gray-800">
                    {form.start.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="mb-2 text-base text-gray-600 font-medium">
                  End Date *
                </Text>
                <TouchableOpacity
                  className="border border-gray-300 p-3 rounded-lg bg-white"
                  onPress={() => setEndDatePickerVisible(true)}
                >
                  <Text className="text-base text-gray-800">
                    {form.end.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Date Range Display */}
          <View className="bg-blue-50 p-4 rounded-lg mb-4">
            <Text className="text-sm text-gray-600 mb-1">Selected Range:</Text>
            <Text className="text-base font-semibold text-blue-800">
              {formatDateRange()}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Each day runs from 12:00 AM to 11:59 PM
            </Text>
          </View>

          {/* Reset Intervals */}
          <Text className="mb-2 text-base text-gray-600 font-medium">
            Reset Intervals (Days)
          </Text>
          <TextInput
            placeholder="Days between timer resets (optional)"
            className="border border-gray-300 p-3 rounded-lg mb-4 text-base bg-white"
            keyboardType="numeric"
            value={resetIntervalsInput}
            onChangeText={handleIntervalReset}
          />
        </View>

        {/* Date Pickers */}
        {isStartDatePickerVisible && (
          <DateTimePickerModal
            mode="date"
            value={form.start}
            onChange={(_, date) => {
              if (date) handleStartDateChange(date);
              else setStartDatePickerVisible(false);
            }}
            minimumDate={new Date()}
          />
        )}

        {isEndDatePickerVisible && (
          <DateTimePickerModal
            mode="date"
            value={form.end}
            onChange={(_, date) => {
              if (date) handleEndDateChange(date);
              else setEndDatePickerVisible(false);
            }}
            minimumDate={form.start}
          />
        )}

        {/* Customization Card */}
        <View className="bg-white rounded-xl p-5 mb-5 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Customization
          </Text>

          {/* Color Picker */}
          <Text className="mb-3 text-base text-gray-600 font-medium">
            Theme Color
          </Text>
          <View className="flex-row flex-wrap justify-between mb-5">
            {colors.map((clr) => (
              <TouchableOpacity
                key={clr}
                className={`w-12 h-12 rounded-full m-1 shadow-sm ${
                  form.color === clr ? "border-4 border-gray-800" : "border-0"
                }`}
                style={{
                  backgroundColor: clr,
                  width: (width - 80) / 5 - 8,
                  height: 50,
                }}
                onPress={() => setForm({ ...form, color: clr })}
              />
            ))}
          </View>

          {/* Timer Input */}
          <Text className="mb-3 text-base text-gray-600 font-medium">
            Focus Timer Duration
          </Text>
          <View className="flex-row justify-between">
            <View className="w-5/12">
              <Text className="mb-2 text-sm text-gray-500">Hours</Text>
              <TextInput
                keyboardType="numeric"
                className="border border-gray-300 p-3 rounded-lg text-base text-center bg-white"
                value={form.timer.hoursLeft.toString()}
                onChangeText={(text) => {
                  const hours = parseInt(text) || 0;
                  setForm({
                    ...form,
                    timer: {
                      ...form.timer,
                      hoursLeft: hours,
                      initialHours: hours,
                      secondsLeft: hours * 3600 + form.timer.minutesLeft * 60,
                      initialSeconds:
                        hours * 3600 + form.timer.minutesLeft * 60,
                    },
                  });
                }}
              />
            </View>
            <View className="w-5/12">
              <Text className="mb-2 text-sm text-gray-500">Minutes</Text>
              <TextInput
                keyboardType="numeric"
                className="border border-gray-300 p-3 rounded-lg text-base text-center bg-white"
                value={form.timer.minutesLeft.toString()}
                onChangeText={(text) => {
                  const minutes = parseInt(text) || 0;
                  setForm({
                    ...form,
                    timer: {
                      ...form.timer,
                      minutesLeft: minutes,
                      initialMinutes: minutes,
                      secondsLeft: form.timer.hoursLeft * 3600 + minutes * 60,
                      initialSeconds:
                        form.timer.hoursLeft * 3600 + minutes * 60,
                    },
                  });
                }}
              />
            </View>
          </View>
        </View>

        {/* Tasks Card */}
        <View className="bg-white rounded-xl p-5 mb-5 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Tasks
          </Text>

          {/* Task Input */}
          <View className="flex-row items-center mb-4">
            <TextInput
              placeholder="Add a task..."
              className="flex-1 border border-gray-300 p-3 rounded-lg mr-3 text-base bg-white"
              value={taskInput}
              onChangeText={setTaskInput}
              onSubmitEditing={handleAddTask}
            />
            <TouchableOpacity
              className="px-5 py-3 rounded-lg shadow-sm"
              style={{ backgroundColor: form.color }}
              onPress={handleAddTask}
            >
              <Text className="text-white font-semibold">Add</Text>
            </TouchableOpacity>
          </View>

          {/* Task List */}
          {form.tasks.length > 0 && (
            <View>
              <Text className="text-base font-medium text-gray-600 mb-3">
                Task List ({form.tasks.length})
              </Text>
              {form.tasks.map((task, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between bg-gray-50 p-3 rounded-lg mb-2"
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: form.color }}
                    />
                    <Text className="text-base text-gray-700 flex-1">
                      {task.task}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => handleRemoveTask(index)}
                  >
                    <Text className="text-red-500 font-semibold">✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`p-4 rounded-xl shadow-sm mb-5 ${
            saveLoading ? "opacity-50" : ""
          }`}
          style={{ backgroundColor: form.color }}
          onPress={handleSubmit}
          disabled={saveLoading}
        >
          <Text className="text-white text-lg font-bold text-center">
            {saveLoading ? "Creating..." : "Create Time Slot"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Create;
