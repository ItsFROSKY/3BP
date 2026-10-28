#pragma once

inline float simulationSpeed = 0.25f;
inline float simulationSpeedReal = 0.25f;
inline constexpr float mouseSensitivity = 0.12f;
inline constexpr float NormalCameraSpeed = 50.0f;
inline constexpr float FastCameraSpeed = 7000.0f;
inline constexpr float swirlFactor = 2.0f; // the swirl factor for the shader, how much it swirls
inline constexpr float maxRK4steps = 10.0;
inline constexpr bool drawGridBool = false;
inline constexpr bool drawTailOnOff = true;
inline constexpr bool  deleteTailBool= true;
inline constexpr bool  DrawTextInfo= true;
// Fixed trail length in world space units
inline constexpr float TARGET_TRAIL_LENGTH = 500.0f;
inline constexpr float Trail_update_NoDelete = 1.0f;
inline constexpr float RecordFramRate = 10.0f; //record at 60fps
inline constexpr float  simulationRecordSpeed = 500.0f;

inline constexpr int Tail_Segments_No_delete = 2500;
inline constexpr int Stable_system_runNum = 3;

inline constexpr float fixedDeltaTime = 0.00833f; // 120 checks per sec, 1/120 = 0.00833
// vector3 (x ,z aka hieght, y)

inline constexpr float G = 200.0f;        // normalize the G value
inline constexpr double convert = 0.0175; // this is pi/180
inline constexpr float MusicVolume = 0.1f;
