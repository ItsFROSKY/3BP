#pragma once
const int screenWidth = 1900;
const int screenHeight = 1000;

//inline constexpr int screenWidth = 2490;
//inline constexpr int screenHeight = 1390;

inline constexpr float simulationSpeed = 10.0f;
inline constexpr float mouseSensitivity = 0.12f;
inline constexpr float NormalCameraSpeed = 0.3f;
inline constexpr float fixedDeltaTime =0.01666f; // 60 checks per sec, 1/60 = 0.01666
// vector3 (x ,z aka hieght, y)

inline constexpr float G = 200.0f;        // normalize the G value
inline constexpr double convert = 0.0175; // this is pi/180