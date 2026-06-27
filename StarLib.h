#pragma once
#include "raylib.h"
#include <vector>

struct Vector3Double {
  double x;
  double y;
  double z;
}; //for more accuracy

Vector3 convertVcetor3 (Vector3Double old);

class star {
public:
  // SoA (struct of arrays) for better cache performance
  std::vector<Vector3Double> pos;
  std::vector<float> mass;
  std::vector<float> rad;   // radius
  std::vector<Vector3Double> vel; // velocity
  std::vector<Vector3Double> dv;
  std::vector<Vector3Double> dp; // change in position
  std::vector<Color> color;

  // std::vector<float> temp;  temperature for later use
  // std::vector<float> luminosity;

  void addStar(Vector3Double position, float newMass, float radius,
               Vector3Double velocity = Vector3Double{0.0f, 0.0f, 0.0f},
               Color newColor = YELLOW);
};

class stableCollection {
  public:

  Vector3Double position;
  float newMass;
  float radius;
  Vector3Double velocity;
  Color newColor;
  
  void addCollection (Vector3Double position, float newMass, float radius,
               Vector3Double velocity,
               Color newColor);
};

float pairPressed(int key1, int key2);

void move(Vector3Double &original, Vector3Double direction, float speed, float dt);

void gravity(star &starsObj, Sound &sound);

void applyGravity(star &starsObj, float dt);

Vector3 angleConvert(double angle, float magnitude);

void stableTwoStars(star &stars, float swivel, float tilt, int j, int k);

void takeInput();