"""
routers/sensor.py
FastAPI router for USB sensor connection controls and real-time WebSocket data streaming.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
import asyncio
import json

from services.sensor_service import get_sensor_service, SensorService
from services.inference_service import get_inference_service
from services.database_service import save_prediction

router = APIRouter(tags=["Sensor"])


@router.post("/connect_usb")
def connect_sensor(
    port: str = Query(None, description="COM Port device name, e.g. 'COM8'"),
    sensor_svc: SensorService = Depends(get_sensor_service),
):
    """
    Connects to the ESP32 sensor on the specified COM port (default COM8).
    Starts reading incoming data in a background thread.
    """
    res = sensor_svc.connect(port)
    if not res["success"]:
        return {"success": False, "error": res["error"]}
    return {"success": True, "data": res}


@router.post("/disconnect_usb")
def disconnect_sensor(sensor_svc: SensorService = Depends(get_sensor_service)):
    """Disconnects the active USB COM port connection."""
    res = sensor_svc.disconnect()
    return {"success": True, "data": res}


@router.websocket("/live_sensor_data")
async def live_sensor_websocket(
    websocket: WebSocket,
    sensor_svc: SensorService = Depends(get_sensor_service),
):
    """
    WebSocket endpoint that streams real-time sensor readings from ESP32.
    Clients receive predictions dynamically as new hardware readings arrive.
    """
    await websocket.accept()
    print("[WebSocket] Client connected for live sensor data.")

    # Setup callback queue to bridge background thread and async websocket
    queue = asyncio.Queue()
    inference_svc = get_inference_service("tomato")

    def thread_safe_callback(data: dict):
        # Schedule queue insert in the running async event loop
        loop = asyncio.get_running_loop()
        loop.call_soon_threadsafe(queue.put_nowait, data)

    # Register callback on the sensor service
    sensor_svc.register_callback(thread_safe_callback)

    try:
        while True:
            # Wait for new reading in queue
            reading = await queue.get()

            # Server-side inference & DB logging to minimize client-side HTTP overhead
            full_payload = {**reading}
            try:
                raw_bands = {
                    "Blue": reading["Blue"],
                    "Green": reading["Green"],
                    "Yellow": reading["Yellow"],
                    "Orange": reading["Orange"],
                    "Red": reading["Red"],
                    "NIR": reading["NIR"],
                }
                pred = inference_svc.predict_single(raw_bands)
                
                # Combine reading and prediction
                full_payload = {**reading, **pred}

                # Save record to SQLite + CSV dual-storage
                save_prediction({
                    **raw_bands,
                    **pred,
                    "tomato_id": reading.get("tomato_id"),
                    "position": reading.get("position"),
                    "input_source": "usb",
                })
            except Exception as pe:
                print(f"[WebSocket] Server-side prediction/DB log error: {pe}")

            # Broadcast combined data to the client
            await websocket.send_json({
                "status": "reading",
                "data": full_payload,
            })
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected from live sensor data.")
    except Exception as e:
        print(f"[WebSocket] Error in websocket loop: {e}")
    finally:
        sensor_svc.unregister_callback(thread_safe_callback)
