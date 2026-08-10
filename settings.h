#pragma once
//const int screenWidth = 1900;
//const int screenHeight = 1000;

inline constexpr int screenWidth = 2490;
inline constexpr int screenHeight = 1390;

//inline constexpr float simulationSpeed = 150.0f;
inline constexpr float simulationSpeed = 1.0f;
inline constexpr float mouseSensitivity = 0.12f;
inline constexpr float NormalCameraSpeed = 0.03f;
inline constexpr float swirlFactor = 6.0f; // the swirl factor for the shader, how much it swirls

inline constexpr float fixedDeltaTime = 0.00833f; // 120 checks per sec, 1/120 = 0.00833
// vector3 (x ,z aka hieght, y)

inline constexpr float G = 200.0f;        // normalize the G value
inline constexpr double convert = 0.0175; // this is pi/180
inline constexpr float MusicVolume = 0.02f;