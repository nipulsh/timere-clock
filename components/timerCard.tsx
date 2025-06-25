import { task } from "@/constants/tasks";
import timeSlot from "@/constants/timeSlot";
import useDelete from "@/hooks/useDelete";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

type TimerProps = {
  timer: timeSlot;
  onDelete?: () => void;
  onUpdate?: () => void;
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const TimerCard: React.FC<TimerProps> = ({ timer, onDelete }) => {
  const deleteTimer = useDelete();

  const handleTimerDelete = async (event: any) => {
    // Prevent navigation when delete button is pressed
    event.preventDefault();
    event.stopPropagation();

    Alert.alert("Delete Timer", "Are you sure you want to delete this timer?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTimer(timer.id);
            onDelete?.();
          } catch (error) {
            console.error("Error deleting timer:", error);
            Alert.alert("Error", "Failed to delete timer. Please try again.");
          }
        },
      },
    ]);
  };

  const totalSeconds =
    (timer.timer.initialHours || 0) * 3600 +
    (timer.timer.initialMinutes || 0) * 60;

  // Get first 2 tasks to display
  const displayTasks: task[] = timer.tasks?.slice(0, 2) || [];
  const hasMoreTasks = (timer.tasks?.length || 0) > 2;

  return (
    <View className="mb-4">
      <Link href={`/timer/${timer.id}`} asChild>
        <TouchableOpacity>
          <View className="bg-neutral-900 rounded-3xl p-6 mx-2 shadow-lg border border-neutral-700">
            {/* Header with title and delete button */}
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 mr-3">
                <Text
                  className="text-3xl font-bold text-white mb-1"
                  numberOfLines={2}
                >
                  {timer.title}
                </Text>
                <Text className="text-neutral-400 text-sm">
                  {timer.tasks?.length || 0} task
                  {(timer.tasks?.length || 0) !== 1 ? "s" : ""}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleTimerDelete}
                className="bg-red-500/20 p-3 rounded-full border border-red-500/30"
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* Timer Display */}
            <View className="bg-neutral-800 rounded-2xl p-6 mb-4 items-center border border-neutral-600">
              <Text className="text-4xl font-mono font-bold text-white mb-2">
                {formatTime(totalSeconds)}
              </Text>
              <Text className="text-neutral-400 text-sm uppercase tracking-wider">
                Duration
              </Text>
            </View>

            {/* Tasks Preview */}
            {displayTasks.length > 0 && (
              <View className="mb-4">
                <Text className="text-neutral-300 font-semibold text-sm uppercase tracking-wider mb-3">
                  Tasks Preview
                </Text>
                <View className="space-y-2">
                  {displayTasks.map((task, index) => (
                    <View
                      key={task.id || index}
                      className="flex-row items-center bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-600"
                    >
                      <View className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                      <Text
                        className="text-neutral-200 flex-1 text-sm"
                        numberOfLines={1}
                      >
                        {task.task || "Untitled Task"}
                      </Text>
                    </View>
                  ))}
                </View>

                {hasMoreTasks && (
                  <View className="flex-row items-center justify-center py-2 mt-2">
                    <Text className="text-neutral-400 text-xs">
                      +{(timer.tasks?.length || 0) - 2} more task
                      {(timer.tasks?.length || 0) - 2 !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Start Timer Button */}
            <View className="mt-4 pt-4 border-t border-neutral-700">
              <View className="flex-row items-center justify-center">
                <Ionicons name="play-circle" size={24} color="#3b82f6" />
                <Text className="text-blue-400 font-semibold ml-2">
                  Tap to Start Timer
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default TimerCard;
