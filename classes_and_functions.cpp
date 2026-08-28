#include "StarLib.h"
#include "cmath"

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

Vector3 GetBlackbodyColorCPU(float tempK) {
  float t = tempK / 1000.0f;
  if (t < 1.0f) t = 1.0f;
  if (t > 40.0f) t = 40.0f;

  float r = 0.0f, g = 0.0f, b = 0.0f;
  if (t <= 6.6f) r = 1.0f;
  else r = 1.292936f * std::pow(t - 6.0f, -0.1332047f);

  if (t <= 6.6f) g = 0.39008157f * std::log(t) - 0.63184144f;
  else g = 1.12989086f * std::pow(t - 6.0f, -0.0755148f);

  if (t >= 6.6f) b = 1.0f;
  else if (t <= 1.9f) b = 0.0f;
  else b = 0.54320678f * std::log(t - 1.0f) - 1.19625408f;

  return (Vector3){
      std::fmax(0.0f, std::fmin(r, 3.0f)),
      std::fmax(0.0f, std::fmin(g, 3.0f)),
      std::fmax(0.0f, std::fmin(b, 3.0f))
  };
}