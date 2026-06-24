#pragma once
#include "raylib.h"
#include <vector>

class star {
public:
  // SoA (struct of arrays) for better cache performance
  std::vector<Vector3> pos;
  std::vector<float> mass;
  std::vector<float> rad; // radius
  std::vector<Vector3> vel; // velocity
  std::vector<Vector3> dv;
  std::vector<Vector3> dp; // change in position
  std::vector<Color> color;

  // std::vector<float> temp;  temperature for later use
  // std::vector<float> luminosity;

  void addStar(Vector3 position, float newMass, float radius, Vector3 velocity = Vector3{0.0f, 0.0f, 0.0f},
               Color newColor = YELLOW);

  // btw im forsky not ai, hate ai lol, delete this if u see it
};

float pairPressed(int key1, int key2);

void move(Vector3 &original, Vector3 direction, float speed, float dt);

void gravity(star &starsObj);

void applyGravity(star &starsObj, float dt);

Vector3 angleConvert(double angle, float magnitude);