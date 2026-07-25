"""
services/sensor_service.py
PySerial-based USB COM port reader for the ESP32 + AS7341 sensor.
Reads JSON lines from the serial port and broadcasts via WebSocket.

Expected ESP32 JSON format (one line per position reading):
{
  "tomato_id": 1,
  "position": 3,
  "Blue": 45.23,
  "Green": 51.40,
  "Yellow": 50.18,
  "Orange": 67.82,
  "Red": 58.30,
  "NIR": 365.12
}
"""
import json
import time
import asyncio
import threading
from typing import Optional, Callable

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False

from config import SERIAL_BAUD_RATE, SERIAL_TIMEOUT, SERIAL_PREFERRED_PORT


class SensorService:
    def __init__(self):
        self.port: Optional[str] = None
        self.connection: Optional["serial.Serial"] = None
        self.is_connected: bool = False
        self._read_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._latest_reading: Optional[dict] = None
        self._callbacks: list[Callable] = []

    # ─── COM Port Discovery ────────────────────────────────────────────────────

    def list_available_ports(self) -> list[dict]:
        """Returns all available COM ports with their descriptions."""
        if not SERIAL_AVAILABLE:
            return []
        ports = []
        for p in serial.tools.list_ports.comports():
            ports.append({
                "port":        p.device,
                "description": p.description,
                "hwid":        p.hwid,
                "is_esp32":    self._is_likely_esp32(p),
            })
        return ports

    def _is_likely_esp32(self, port_info) -> bool:
        """Heuristic: CP210x and CH340 chips are common on ESP32 dev boards."""
        keywords = ["CP210", "CH340", "USB-SERIAL", "ESP32", "Silicon Labs", "wch"]
        desc = (port_info.description or "").lower() + (port_info.hwid or "").lower()
        return any(k.lower() in desc for k in keywords)

    def find_esp32_port(self) -> Optional[str]:
        """Auto-detect the most likely ESP32 COM port."""
        if SERIAL_PREFERRED_PORT:
            return SERIAL_PREFERRED_PORT
        for p in serial.tools.list_ports.comports():
            if self._is_likely_esp32(p):
                return p.device
        # Fallback: return last available COM port
        ports = list(serial.tools.list_ports.comports())
        return ports[-1].device if ports else None

    # ─── Connect / Disconnect ─────────────────────────────────────────────────

    def connect(self, port: Optional[str] = None) -> dict:
        """Open serial connection and start background reader thread."""
        if not SERIAL_AVAILABLE:
            return {"success": False, "error": "PySerial not installed"}

        if self.is_connected:
            return {"success": True, "port": self.port, "message": "Already connected"}

        target_port = port or self.find_esp32_port()
        if not target_port:
            return {"success": False, "error": "No COM ports detected. Check USB connection."}

        try:
            self.connection = serial.Serial(
                port=target_port,
                baudrate=SERIAL_BAUD_RATE,
                timeout=SERIAL_TIMEOUT,
            )
            self.port = target_port
            self.is_connected = True
            self._stop_event.clear()
            self._read_thread = threading.Thread(target=self._read_loop, daemon=True)
            self._read_thread.start()
            return {
                "success": True,
                "port": self.port,
                "baud_rate": SERIAL_BAUD_RATE,
                "message": f"Connected to ESP32 on {self.port}",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def disconnect(self) -> dict:
        """Stop reader thread and close serial port."""
        self._stop_event.set()
        if self.connection and self.connection.is_open:
            self.connection.close()
        self.is_connected = False
        self.port = None
        self.connection = None
        self._latest_reading = None
        return {"success": True, "message": "Sensor disconnected"}

    # ─── Background Reader ────────────────────────────────────────────────────

    def _read_loop(self):
        """Continuously reads JSON lines from the serial port."""
        while not self._stop_event.is_set():
            try:
                if not self.connection or not self.connection.is_open:
                    break
                raw = self.connection.readline().decode("utf-8", errors="ignore").strip()
                if not raw:
                    continue
                data = json.loads(raw)
                self._latest_reading = data
                # Fire all registered callbacks (for WebSocket broadcasting)
                for cb in self._callbacks:
                    try:
                        cb(data)
                    except Exception:
                        pass
            except json.JSONDecodeError:
                pass  # Ignore malformed lines (startup noise, etc.)
            except Exception:
                time.sleep(0.1)

    # ─── Callbacks (for WebSocket broadcasting) ───────────────────────────────

    def register_callback(self, cb: Callable):
        if cb not in self._callbacks:
            self._callbacks.append(cb)

    def unregister_callback(self, cb: Callable):
        if cb in self._callbacks:
            self._callbacks.remove(cb)

    def get_latest_reading(self) -> Optional[dict]:
        return self._latest_reading

    def get_status(self) -> dict:
        ports = self.list_available_ports()
        return {
            "is_connected":      self.is_connected,
            "port":              self.port,
            "baud_rate":         SERIAL_BAUD_RATE if self.is_connected else None,
            "serial_available":  SERIAL_AVAILABLE,
            "available_ports":   ports,
            "esp32_detected":    any(p["is_esp32"] for p in ports),
        }


# Singleton
_sensor_service = SensorService()


def get_sensor_service() -> SensorService:
    return _sensor_service
