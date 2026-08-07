#include "StarLib.h"

void star::addStar(Vector3 position, float newMass, float radius,
                   Vector3 velocity, Color newColor) {
  pos.push_back(position);
  mass.push_back(newMass);
  rad.push_back(radius);
  vel.push_back(velocity);
  dv.push_back(Vector3{0.0, 0.0, 0.0});
  dp.push_back(Vector3{0.0, 0.0, 0.0});
  color.push_back(newColor);
  Vector3 cameraVar;
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