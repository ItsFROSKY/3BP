#include "StarLib.h"
#include "cmath"

Vector3 GetBlackbodyColorCPU(float tempK) {
    // Clamp temperature to valid range (1000K to 40000K) and scale by 100
    float temp = std::fmax(1000.0f, std::fmin(tempK, 40000.0f)) / 100.0f;

    float r = 0.0f;
    float g = 0.0f;
    float b = 0.0f;

    //Red Channel
    if (temp <= 66.0f) {
        r = 255.0f;
    } else {
        r = temp - 60.0f;
        r = 329.698727446f * std::pow(r, -0.1332047592f);
    }

    //Green Channel
    if (temp <= 66.0f) {
        g = temp;
        g = 99.4708025861f * std::log(g) - 161.1195681661f;
    } else {
        g = temp - 60.0f;
        g = 288.1221695283f * std::pow(g, -0.0755148492f);
    }

    //Blue Channel
    if (temp >= 66.0f) {
        b = 255.0f;
    } else if (temp <= 19.0f) {
        b = 0.0f;
    } else {
        b = temp - 10.0f;
        b = 138.5177312231f * std::log(b) - 305.0447927307f;
    }

    // Normalize 0..255 to 0.0..1.0 float RGB
    return (Vector3){
        std::fmax(0.0f, std::fmin(r / 255.0f, 1.0f)),
        std::fmax(0.0f, std::fmin(g / 255.0f, 1.0f)),
        std::fmax(0.0f, std::fmin(b / 255.0f, 1.0f))
    };
}

void star::addStar(Vector3 position, float newMass, float radius,
                   Vector3 velocity, Color newColor, bool blackbodyColor, float Newtemperature, float Newluminosity) {
  pos.push_back(position);
  mass.push_back(newMass);
  rad.push_back(radius);
  vel.push_back(velocity);
  dv.push_back(Vector3{0.0, 0.0, 0.0});
  dp.push_back(Vector3{0.0, 0.0, 0.0});
  color.push_back(newColor);
  BlackbodyColorActivation.push_back(blackbodyColor);
  temp.push_back(Newtemperature);
  luminosity.push_back(Newluminosity);
  Vector3 cameraVar;
  Vector3 TempColorNormalized = {newColor.r / 255.0f, newColor.g / 255.0f, newColor.b / 255.0f};
  ColorNormalized.push_back(TempColorNormalized);
  BBColor.push_back(GetBlackbodyColorCPU(Newtemperature));
}

void star::epsilonValue(double epsilon, Vector3 cameraNew) {
  epsilon_squared = epsilon;
  cameraVar = cameraNew;
}

float pairPressed(int key1, int key2) {
  return (float)IsKeyDown(key1) - (float)IsKeyDown(key2);
}

void move(Vector3 &original, Vector3 direction, float speed,
          float dt) {
  original.x += direction.x * speed * dt;
  original.y += direction.y * speed * dt;
  original.z += direction.z * speed * dt;
}

Vector3 convertVcetor3(Vector3 old) {
  Vector3 converted;
  converted.x = (float)old.x;
  converted.y = (float)old.y;
  converted.z = (float)old.z;
  return converted;
}

void setStarShaderColor(Shader starShader, int ColorLoc, Color starColor) {
  float RGB[3] = {starColor.r / 255.0f, starColor.g / 255.0f,
                  starColor.b / 255.0f};
  SetShaderValue(starShader, ColorLoc, RGB, SHADER_UNIFORM_VEC3);
}

