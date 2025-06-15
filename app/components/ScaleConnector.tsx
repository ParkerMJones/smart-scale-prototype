import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { ScaleReading } from "~/types/scale";
import {
  isBluetoothSupported,
  requestScaleDevice,
  connectToScale,
  parseScaleData,
  formatWeight,
} from "~/utils/scaleUtils";

interface ScaleConnectorProps {
  onStableReading: (reading: ScaleReading) => void;
  className?: string;
}

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export function ScaleConnector({
  onStableReading,
  className,
}: ScaleConnectorProps) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [currentReading, setCurrentReading] = useState<ScaleReading | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [lastStableReading, setLastStableReading] =
    useState<ScaleReading | null>(null);

  // Handle incoming scale data
  const handleCharacteristicValueChanged = useCallback(
    (event: Event) => {
      const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
      const data = characteristic.value;

      if (!data) return;

      const reading = parseScaleData(data);
      if (reading) {
        setCurrentReading(reading);

        // If reading is stable and different from last stable reading, trigger callback
        if (
          reading.isStable &&
          (!lastStableReading ||
            lastStableReading.weight !== reading.weight ||
            lastStableReading.unit !== reading.unit)
        ) {
          setLastStableReading(reading);
          onStableReading(reading);
        }
      }
    },
    [lastStableReading, onStableReading]
  );

  // Connect to the scale
  const connectToScaleDevice = async () => {
    if (!isBluetoothSupported()) {
      setError("Web Bluetooth is not supported in this browser");
      setConnectionState("error");
      return;
    }

    try {
      setConnectionState("connecting");
      setError(null);

      // Request device
      const scaleDevice = await requestScaleDevice();
      setDevice(scaleDevice);

      // Connect and get characteristic
      const char = await connectToScale(scaleDevice);
      setCharacteristic(char);

      // Start notifications
      await char.startNotifications();
      char.addEventListener(
        "characteristicvaluechanged",
        handleCharacteristicValueChanged
      );

      // Handle device disconnect
      scaleDevice.addEventListener("gattserverdisconnected", () => {
        setConnectionState("disconnected");
        setDevice(null);
        setCharacteristic(null);
        setCurrentReading(null);
      });

      setConnectionState("connected");
    } catch (err) {
      console.error("Failed to connect to scale:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect to scale"
      );
      setConnectionState("error");
    }
  };

  // Disconnect from the scale
  const disconnect = () => {
    if (characteristic) {
      characteristic.removeEventListener(
        "characteristicvaluechanged",
        handleCharacteristicValueChanged
      );
    }
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setConnectionState("disconnected");
    setDevice(null);
    setCharacteristic(null);
    setCurrentReading(null);
    setError(null);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div
      className={clsx("bg-white rounded-lg shadow-lg p-6 space-y-4", className)}
    >
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Smart Scale</h2>
        <div className="flex items-center space-x-2">
          <div
            className={clsx("w-3 h-3 rounded-full", {
              "bg-gray-400": connectionState === "disconnected",
              "bg-yellow-400 animate-pulse": connectionState === "connecting",
              "bg-green-400": connectionState === "connected",
              "bg-red-400": connectionState === "error",
            })}
          />
          <span className="text-sm text-gray-600 capitalize">
            {connectionState}
          </span>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-md p-3"
          >
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weight Display */}
      <div className="text-center py-8">
        <AnimatePresence mode="wait">
          {currentReading ? (
            <motion.div
              key="reading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="space-y-2"
            >
              <div
                className={clsx("text-4xl font-bold transition-colors", {
                  "text-gray-600": !currentReading.isStable,
                  "text-green-600": currentReading.isStable,
                })}
              >
                {formatWeight(currentReading.weight, currentReading.unit)}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={clsx("w-2 h-2 rounded-full", {
                    "bg-yellow-400 animate-pulse": !currentReading.isStable,
                    "bg-green-400": currentReading.isStable,
                  })}
                />
                <span className="text-sm text-gray-600">
                  {currentReading.isStable ? "Stable" : "Measuring..."}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-400"
            >
              <div className="text-4xl font-bold">--.-</div>
              <div className="text-sm">No reading</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connection Button */}
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={
            connectionState === "connected" ? disconnect : connectToScaleDevice
          }
          disabled={connectionState === "connecting"}
          className={clsx(
            "px-6 py-2 rounded-lg font-medium transition-colors",
            {
              "bg-blue-600 hover:bg-blue-700 text-white":
                connectionState === "disconnected",
              "bg-gray-400 text-white cursor-not-allowed":
                connectionState === "connecting",
              "bg-red-600 hover:bg-red-700 text-white":
                connectionState === "connected",
              "bg-orange-600 hover:bg-orange-700 text-white":
                connectionState === "error",
            }
          )}
        >
          {connectionState === "disconnected" && "Connect to Scale"}
          {connectionState === "connecting" && "Connecting..."}
          {connectionState === "connected" && "Disconnect"}
          {connectionState === "error" && "Try Again"}
        </motion.button>
      </div>

      {/* Browser Support Warning */}
      {!isBluetoothSupported() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> Web Bluetooth requires Chrome/Edge on desktop
            or Android. Make sure you're using HTTPS.
          </p>
        </div>
      )}
    </div>
  );
}
