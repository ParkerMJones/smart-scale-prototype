import type { ScaleReading } from "~/types/scale";

// Scale service and characteristic UUIDs for Etekcity ESN00
export const SCALE_SERVICE_UUID = "00001910-0000-1000-8000-00805f9b34fb";
export const SCALE_CHARACTERISTIC_UUID = "00002c12-0000-1000-8000-00805f9b34fb";

// Unit mapping for ESN00
const UNIT_MAP: Record<number, "g" | "oz" | "lb" | "kg" | "ml" | "fl oz"> = {
  0: "g", // grams
  1: "oz", // lb:oz format
  2: "g", // grams (multiplied by 10)
  3: "fl oz", // fluid ounces
  4: "ml", // milliliters
  5: "fl oz", // fluid ounces (milk)
  6: "oz", // ounces
};

/**
 * Parse scale data from DataView according to Etekcity ESN00 protocol
 * Based on https://github.com/hertzg/metekcity reverse engineering
 */
export function parseScaleData(data: DataView): ScaleReading | null {
  // ESN00 sends packets of varying lengths (8 bytes without weight, 12 bytes with weight)
  if (data.byteLength < 3) {
    console.warn("Scale data too short:", data.byteLength);
    return null;
  }

  try {
    // Debug: Log the raw packet data
    const rawBytes = Array.from(new Uint8Array(data.buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    console.log(`Raw packet (${data.byteLength} bytes):`, rawBytes);

    // 8-byte packets = no weight/empty scale
    if (data.byteLength === 8) {
      console.log("Empty scale packet (8 bytes)");
      return null;
    }

    // 12-byte packets = weight data
    if (data.byteLength === 12) {
      console.log("Weight packet (12 bytes) - attempting to parse...");

      // Try different parsing approaches for 12-byte packets

      // Method 1: Try original Luminary-style parsing (bytes 10-12)
      if (data.byteLength >= 12) {
        try {
          const sign = data.getUint8(10) === 0 ? 1 : -1;
          const rawWeight = data.getUint16(11, true); // little-endian
          const unitCode = data.byteLength > 14 ? data.getUint8(14) : 0;
          const isStable = true; // assume stable for now

          if (rawWeight > 0 && rawWeight < 50000) {
            const unit = UNIT_MAP[unitCode] || "g";
            const weight = (sign * rawWeight) / (unitCode === 2 ? 10 : 1);
            console.log(
              `Method 1 - Weight: ${weight}${unit}, Raw: ${rawWeight}, Unit code: ${unitCode}`
            );

            return {
              weight,
              unit,
              isStable,
              timestamp: Date.now(),
            };
          }
        } catch (e) {
          console.log("Method 1 failed:", e);
        }
      }

      // Method 2: Try ESN00-style parsing (scan for weight data)
      for (let offset = 0; offset <= data.byteLength - 4; offset++) {
        try {
          const rawWeight = data.getUint16(offset, false); // big-endian
          const nextByte =
            offset + 2 < data.byteLength ? data.getUint8(offset + 2) : 0;

          // Check if this looks like reasonable weight data
          if (rawWeight > 0 && rawWeight < 10000 && nextByte <= 6) {
            const sign =
              offset > 0 ? (data.getUint8(offset - 1) === 0 ? 1 : -1) : 1;
            const unitCode = nextByte;
            const isStable =
              offset + 3 < data.byteLength
                ? data.getUint8(offset + 3) === 1
                : true;

            const unit = UNIT_MAP[unitCode] || "g";
            const divisor = unitCode === 2 || unitCode >= 3 ? 10 : 1;
            const weight = (sign * rawWeight) / divisor;

            if (weight > 0 && weight <= 5000) {
              console.log(
                `Method 2 - Offset ${offset} - Weight: ${weight}${unit}, Raw: ${rawWeight}, Unit: ${unitCode}, Stable: ${isStable}`
              );
              return {
                weight,
                unit,
                isStable,
                timestamp: Date.now(),
              };
            }
          }
        } catch (e) {
          // Continue to next offset
        }
      }

      console.log("No valid weight data found in 12-byte packet");
    }

    // Log other packet lengths for debugging
    if (data.byteLength !== 8 && data.byteLength !== 12) {
      console.log(`Unexpected packet length: ${data.byteLength} bytes`);
    }

    return null;
  } catch (error) {
    console.error("Error parsing scale data:", error);
    return null;
  }
}

/**
 * Check if Web Bluetooth is supported
 */
export function isBluetoothSupported(): boolean {
  return "bluetooth" in navigator;
}

/**
 * Request Bluetooth device with Etekcity scale filters
 */
export async function requestScaleDevice(): Promise<BluetoothDevice> {
  if (!isBluetoothSupported()) {
    throw new Error("Web Bluetooth is not supported in this browser");
  }

  return await navigator.bluetooth.requestDevice({
    filters: [
      { services: [SCALE_SERVICE_UUID] },
      { namePrefix: "Etekcity" },
      { namePrefix: "ESN00" },
    ],
    optionalServices: [SCALE_SERVICE_UUID],
  });
}

/**
 * Connect to scale and return the characteristic for notifications
 */
export async function connectToScale(
  device: BluetoothDevice
): Promise<BluetoothRemoteGATTCharacteristic> {
  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService(SCALE_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(
    SCALE_CHARACTERISTIC_UUID
  );

  return characteristic;
}

/**
 * Convert weight between units for nutrition API calls
 */
export function convertWeight(
  weight: number,
  fromUnit: string,
  toUnit: string
): number {
  const toGrams: Record<string, number> = {
    g: 1,
    oz: 28.3495,
    lb: 453.592,
    kg: 1000,
  };

  const fromGrams: Record<string, number> = {
    g: 1,
    oz: 1 / 28.3495,
    lb: 1 / 453.592,
    kg: 1 / 1000,
  };

  if (fromUnit === toUnit) return weight;

  const grams = weight * toGrams[fromUnit];
  return grams * fromGrams[toUnit];
}

/**
 * Format weight for display
 */
export function formatWeight(weight: number, unit: string): string {
  const precision = unit === "g" ? 0 : 2;
  return `${weight.toFixed(precision)} ${unit}`;
}
