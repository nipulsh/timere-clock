// ActiveTimer.tsx - Component for the active timer screen
import timeSlot from "@/constants/timeSlot";
import useFetch from "@/hooks/useFetch";
import usePost from "@/hooks/usePost";
import { Ionicons } from "@expo/vector-icons";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  FlatList,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { task } from "../../constants/tasks";

import { router, useLocalSearchParams } from "expo-router";

type Props = {
  timerId: string;
  onTimerComplete?: () => void;
  onTimerExit?: () => void;
};

type TimerState = "running" | "paused" | "completed" | "cancelled";

const TIMER_CONFIG = {
  size: 280,
  strokeWidth: 12,
} as const;

const { size, strokeWidth } = TIMER_CONFIG;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

const ActiveTimer: React.FC<Props> = ({
  timerId,
  onTimerComplete,
  onTimerExit,
}) => {
  // Fetch timer data
  const { timers, loading } = useFetch();
  const { saveTimer } = usePost();

  // Find the current timer
  const timer = timers?.find((t: timeSlot) => t.id === timerId);

  // State management
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>("paused");
  const [taskList, setTaskList] = useState<task[]>([]);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
  const [initialSeconds, setInitialSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize timer data when timer is loaded
  useEffect(() => {
    if (timer) {
      const initial =
        (timer.timer.initialHours || 0) * 3600 +
        (timer.timer.initialMinutes || 0) * 60 +
        (timer.timer.initialSeconds || 0);

      setInitialSeconds(initial);
      setSecondsLeft(timer.timer.secondsLeft || initial);
      setTaskList(timer.tasks || []);

      // Set timer state based on current status
      if (timer.timer.secondsLeft === 0) {
        setTimerState("completed");
      } else if (timer.timer.isRunning) {
        setTimerState("running");
      } else {
        setTimerState("paused");
      }
    }
  }, [timer]);

  // Calculate progress for circular indicator
  const progress = initialSeconds > 0 ? secondsLeft / initialSeconds : 0;
  const strokeDashoffset = circumference * (1 - progress);

  // Save timer state to backend
  const saveTimerState = useCallback(
    async (updatedTimer: Partial<timeSlot>) => {
      if (!timer) return;

      try {
        const timerToSave: timeSlot = {
          ...timer,
          ...updatedTimer,
          timer: {
            ...timer.timer,
            ...updatedTimer.timer,
          },
          tasks: updatedTimer.tasks || timer.tasks,
        };

        await saveTimer(timerToSave);
      } catch (error) {
        console.error("Failed to save timer:", error);
      }
    },
    [timer, saveTimer]
  );

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" && timerState === "running") {
        setBackgroundTime(Date.now());
      } else if (
        nextAppState === "active" &&
        backgroundTime &&
        timerState === "running"
      ) {
        const timeInBackground = Math.floor(
          (Date.now() - backgroundTime) / 1000
        );
        const newSecondsLeft = Math.max(0, secondsLeft - timeInBackground);
        setSecondsLeft(newSecondsLeft);
        setBackgroundTime(null);

        // Save the updated time to backend
        saveTimerState({
          timer: {
            initialSeconds: timer?.timer?.initialSeconds || 0,
            initialHours: timer?.timer?.initialHours || 0,
            initialMinutes: timer?.timer?.initialMinutes || 0,
            id: timer?.timer?.id || "",
            hoursLeft: timer?.timer?.hoursLeft || 0,
            minutesLeft: timer?.timer?.minutesLeft || 0,
            timesStopped: timer?.timer?.timesStopped || 0,
            secondsLeft: newSecondsLeft,
            isRunning: true,
          },
        });
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [timerState, backgroundTime, secondsLeft, saveTimerState, timer]); // Fixed: Removed timer.timer from dependencies

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerState === "running" && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const newSeconds = prev - 1;

          if (newSeconds <= 0) {
            setTimerState("completed");
            Vibration.vibrate([500, 200, 500]);

            // Save completed state to backend
            saveTimerState({
              timer: {
                initialSeconds: timer?.timer?.initialSeconds || 0,
                initialHours: timer?.timer?.initialHours || 0,
                initialMinutes: timer?.timer?.initialMinutes || 0,
                id: timer?.timer?.id || "",
                hoursLeft: timer?.timer?.hoursLeft || 0,
                minutesLeft: timer?.timer?.minutesLeft || 0,
                timesStopped: timer?.timer?.timesStopped || 0,
                secondsLeft: 0,
                isRunning: false,
              },
            });

            onTimerComplete?.();
            return 0;
          }

          // Save progress every 10 seconds to avoid too many API calls
          if (newSeconds % 10 === 0) {
            saveTimerState({
              timer: {
                initialSeconds: timer?.timer?.initialSeconds || 0,
                initialHours: timer?.timer?.initialHours || 0,
                initialMinutes: timer?.timer?.initialMinutes || 0,
                id: timer?.timer?.id || "",
                hoursLeft: timer?.timer?.hoursLeft || 0,
                minutesLeft: timer?.timer?.minutesLeft || 0,
                timesStopped: timer?.timer?.timesStopped || 0,
                secondsLeft: newSeconds,
                isRunning: true,
              },
            });
          }

          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    timerState,
    secondsLeft,
    onTimerComplete,
    saveTimerState,
    timer?.timer?.initialSeconds,
    timer?.timer?.initialHours,
    timer?.timer?.initialMinutes,
    timer?.timer?.id,
    timer?.timer?.hoursLeft,
    timer?.timer?.minutesLeft,
    timer?.timer?.timesStopped,
  ]);

  const handlePlayPause = useCallback(async () => {
    if (timerState === "completed" || timerState === "cancelled") {
      return;
    }

    const newState = timerState === "running" ? "paused" : "running";
    setTimerState(newState);

    // Save play/pause state to backend
    await saveTimerState({
      timer: {
        initialSeconds: timer?.timer?.initialSeconds || 0,
        initialHours: timer?.timer?.initialHours || 0,
        initialMinutes: timer?.timer?.initialMinutes || 0,
        id: timer?.timer?.id || "",
        hoursLeft: timer?.timer?.hoursLeft || 0,
        minutesLeft: timer?.timer?.minutesLeft || 0,
        timesStopped: timer?.timer?.timesStopped || 0,
        secondsLeft: secondsLeft,
        isRunning: newState === "running",
      },
    });
  }, [
    timerState,
    saveTimerState,
    timer?.timer?.initialSeconds,
    timer?.timer?.initialHours,
    timer?.timer?.initialMinutes,
    timer?.timer?.id,
    timer?.timer?.hoursLeft,
    timer?.timer?.minutesLeft,
    timer?.timer?.timesStopped,
    secondsLeft,
  ]);

  const handleStop = useCallback(() => {
    Alert.alert(
      "Stop Timer",
      "Are you sure you want to stop the timer? Your progress will be lost.",
      [
        { text: "Continue", style: "cancel" },
        {
          text: "Stop",
          style: "destructive",
          onPress: async () => {
            setTimerState("cancelled");
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            // Save stopped state to backend
            await saveTimerState({
              timer: {
                initialSeconds: timer?.timer?.initialSeconds || 0,
                initialHours: timer?.timer?.initialHours || 0,
                initialMinutes: timer?.timer?.initialMinutes || 0,
                id: timer?.timer?.id || "",
                hoursLeft: timer?.timer?.hoursLeft || 0,
                minutesLeft: timer?.timer?.minutesLeft || 0,
                timesStopped: timer?.timer?.timesStopped || 0,
                secondsLeft: initialSeconds, // Reset to initial time
                isRunning: false,
              },
            });

            onTimerExit?.();
          },
        },
      ]
    );
  }, [
    saveTimerState,
    timer?.timer?.initialSeconds,
    timer?.timer?.initialHours,
    timer?.timer?.initialMinutes,
    timer?.timer?.id,
    timer?.timer?.hoursLeft,
    timer?.timer?.minutesLeft,
    timer?.timer?.timesStopped,
    initialSeconds,
    onTimerExit,
  ]);

  const handleReset = useCallback(() => {
    Alert.alert("Reset Timer", "Reset the timer to its original duration?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: async () => {
          setSecondsLeft(initialSeconds);
          setTimerState("paused");

          // Save reset state to backend
          await saveTimerState({
            timer: {
              initialSeconds: timer?.timer?.initialSeconds || 0,
              initialHours: timer?.timer?.initialHours || 0,
              initialMinutes: timer?.timer?.initialMinutes || 0,
              id: timer?.timer?.id || "",
              hoursLeft: timer?.timer?.hoursLeft || 0,
              minutesLeft: timer?.timer?.minutesLeft || 0,
              timesStopped: timer?.timer?.timesStopped || 0,
              secondsLeft: initialSeconds,
              isRunning: false,
            },
          });
        },
      },
    ]);
  }, [
    initialSeconds,
    saveTimerState,
    timer?.timer?.hoursLeft,
    timer?.timer?.id,
    timer?.timer?.initialHours,
    timer?.timer?.initialMinutes,
    timer?.timer?.initialSeconds,
    timer?.timer?.minutesLeft,
    timer?.timer?.timesStopped,
  ]);

  const handleTaskToggle = useCallback(
    async (taskId: string) => {
      const updatedTasks = taskList.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );

      setTaskList(updatedTasks);

      // Save updated tasks to backend
      await saveTimerState({
        tasks: updatedTasks,
      });
    },
    [taskList, saveTimerState]
  );

  const renderTaskItem = useCallback(
    ({ item }: { item: task }) => (
      <TouchableOpacity
        onPress={() => handleTaskToggle(item.id)}
        className={clsx(
          "rounded-xl px-4 py-3 mb-3 flex-row items-center border",
          item.completed
            ? "bg-green-900/30 border-green-500/50"
            : "bg-gray-800/50 border-gray-600/50"
        )}
        activeOpacity={0.7}
      >
        <View
          className={clsx(
            "w-6 h-6 rounded-full mr-3 border-2 justify-center items-center",
            item.completed ? "bg-green-500 border-green-500" : "border-gray-400"
          )}
        >
          {item.completed && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
        <Text
          className={clsx(
            "text-base flex-1",
            item.completed ? "text-green-200 line-through" : "text-white"
          )}
        >
          {item.task}
        </Text>
      </TouchableOpacity>
    ),
    [handleTaskToggle]
  );

  const getTimerDisplayColor = () => {
    switch (timerState) {
      case "completed":
        return "text-green-400";
      case "cancelled":
        return "text-red-400";
      case "paused":
        return "text-yellow-400";
      default:
        return "text-white";
    }
  };

  const getProgressColor = () => {
    if (timerState === "completed") return "#10b981";
    if (timerState === "cancelled") return "#ef4444";
    if (timerState === "paused") return "#f59e0b";

    // Dynamic color based on progress
    if (progress > 0.5) return "#10b981"; // green
    if (progress > 0.25) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  // Debug logging
  useEffect(() => {
    console.log("ActiveTimer Debug:", {
      loading,
      timersCount: timers?.length || 0,
      timerId,
      timerFound: !!timer,
      timers: timers?.map((t) => ({ id: t.id, title: t.title })) || [],
    });
  }, [loading, timers, timerId, timer]);

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Loading timer...</Text>
      </View>
    );
  }

  // Timer not found state
  if (!timer) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg mb-4">Timer not found</Text>
        <Text className="text-gray-400 text-sm text-center">
          Timer ID: {timerId}
        </Text>
        <Text className="text-gray-400 text-sm text-center">
          Available timers: {timers?.length || 0}
        </Text>
      </View>
    );
  }

  const completedTasksCount = taskList.filter((task) => task.completed).length;
  const totalTasksCount = taskList.length;
  const progressPercentage = Math.round((1 - progress) * 100);

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => {
            router.back();
          }}
          className="p-2 rounded-lg bg-gray-800"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="flex-1 mx-4">
          <Text className="text-white text-xl font-bold text-center">
            {timer.title}
          </Text>
          {timer.description && (
            <Text className="text-gray-400 text-sm text-center mt-1">
              {timer.description}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleReset}
          className="p-2 rounded-lg bg-gray-800"
          disabled={timerState === "completed"}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={timerState === "completed" ? "#6B7280" : "white"}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center px-4">
        {/* Circular Progress */}
        <View className="mb-8 relative">
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1f2937"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getProgressColor()}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>

          {/* Timer Text */}
          <View className="absolute inset-0 justify-center items-center">
            <Text
              className={clsx("text-4xl font-bold", getTimerDisplayColor())}
            >
              {formatTime(secondsLeft)}
            </Text>
            <Text className="text-gray-400 text-sm mt-2">
              {progressPercentage}% complete
            </Text>
            {timerState !== "running" && (
              <View className="flex-row items-center mt-2">
                <View
                  className={clsx(
                    "w-2 h-2 rounded-full mr-2",
                    timerState === "paused"
                      ? "bg-yellow-400"
                      : timerState === "completed"
                      ? "bg-green-400"
                      : "bg-red-400"
                  )}
                />
                <Text className="text-gray-400 text-sm capitalize">
                  {timerState}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Control Buttons */}
        <View className="flex-row justify-center items-center space-x-6 mb-8">
          {timerState !== "completed" && (
            <>
              <TouchableOpacity
                onPress={handleStop}
                className="w-16 h-16 rounded-full bg-red-600 justify-center items-center"
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={28} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePlayPause}
                className={clsx(
                  "w-20 h-20 rounded-full justify-center items-center",
                  timerState === "running" ? "bg-yellow-600" : "bg-green-600"
                )}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={timerState === "running" ? "pause" : "play"}
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Completion Message */}
        {timerState === "completed" && (
          <View className="items-center mb-8">
            <Text className="text-green-400 text-3xl font-bold mb-2">
              🎉 Complete!
            </Text>
            <Text className="text-gray-400 text-center">
              Great job! Time for a well-deserved break.
            </Text>
          </View>
        )}

        {/* Task List */}
        {taskList.length > 0 && (
          <View className="w-full max-w-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">
                Tasks ({completedTasksCount}/{totalTasksCount})
              </Text>
              {totalTasksCount > 0 && (
                <View className="flex-row items-center">
                  <View className="w-16 h-2 bg-gray-700 rounded-full mr-2">
                    <View
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${
                          (completedTasksCount / totalTasksCount) * 100
                        }%`,
                      }}
                    />
                  </View>
                  <Text className="text-gray-400 text-sm">
                    {Math.round((completedTasksCount / totalTasksCount) * 100)}%
                  </Text>
                </View>
              )}
            </View>

            <FlatList
              data={taskList}
              keyExtractor={(item) => item.id}
              renderItem={renderTaskItem}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 200 }}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const TimerScreen = () => {
  const { id } = useLocalSearchParams();

  if (!id || typeof id !== "string") {
    return <Text>Invalid timer ID</Text>;
  }

  return <ActiveTimer timerId={id} />;
};

export default TimerScreen;
