#pragma once
#include "raylib.h"
#include <vector>

class star {
public:
  // SoA (struct of arrays) for better cache performance
  std::vector<Vector3> pos;
  std::vector<float> mass;
  std::vector<float> rad; // radius
  std::vector<float> vel; // velocity
  std::vector<float> dv;
  std::vector<float> dp; // change in position
  std::vector<Color> color;

  // std::vector<float> temp;  temperature for later use
  // std::vector<float> luminosity;

  void addStar(Vector3 position, float newMass, float radius, float velocity,
               Color newColor = YELLOW);

  // btw im forsky not ai, hate ai lol, delete this if u see it
};