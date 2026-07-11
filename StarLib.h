#pragma once
#include "raylib.h"
#include <vector>
using std::vector;

struct Vector3Double {
  double x;
  double y;
  double z;
}; // for more accuracy

Vector3 convertVcetor3(Vector3Double old);

class star {
public:
  // SoA (struct of arrays) for better cache performance
  vector<Vector3Double> pos;
  vector<float> mass;
  vector<float> rad;         // radius
  vector<Vector3Double> vel; // velocity
  vector<Vector3Double> dv;
  vector<Vector3Double> dp; // change in position
  vector<Color> color;
  double epsilon_squared;
  Vector3 cameraVar;

  // vector<float> temp;  temperature for later use
  // vector<float> luminosity;

  void addStar(Vector3Double position, float newMass, float radius,
               Vector3Double velocity = Vector3Double{0.0, 0.0, 0.0},
               Color newColor = YELLOW);

  void epsilonValue(double epsilon,
                    Vector3 cameraNew = Vector3{800.0f, 800.0f, 800.0f});
};

float pairPressed(int key1, int key2);

void move(Vector3Double &original, Vector3Double direction, float speed,
          float dt);

void gravity(star &starsObj, Sound &sound);

void applyGravity(star &starsObj, float dt);

Vector3 angleConvert(double angle, float magnitude);

void stableTwoStars(star &stars, float swivel, float tilt, int j, int k);

void takeInput();

vector<Vector3Double> measureAcceleration(star &stars, vector<Vector3Double> tempPos, float dt, vector<Vector3Double> &DvTemp);

void RK4 (star &stars, float dt);



// Declaration (extern - definition in 3bp.cpp)
inline constexpr int stableSystemSize = 5;
extern star stableSystemSave[stableSystemSize];
inline constexpr Vector3 closeCamera = {50.0f,50.0f,50.0f};









// Initialization function (no parameters), just saves some stable systems to
// use
inline void initStableSystem() {
  stableSystemSave[0].addStar(Vector3Double{-100, 200.0, -100.0}, 0.5f, 20.0f,
                              Vector3Double{0.01, -0.01, 5.0});
  stableSystemSave[0].addStar(Vector3Double{1100, -200.0, 100.0}, 0.25f, 20.0f,
                              Vector3Double{-0.01, 0.01, -5.0}, BLUE);
  stableSystemSave[0].addStar(Vector3Double{500.0, 50.0, 0.0}, 100.0f, 100.0f,
                              Vector3Double{}, RED);
  stableSystemSave[0].epsilonValue(0.1f, closeCamera);

  stableSystemSave[1].addStar(Vector3Double{10.0, 30.0, 0.0}, 100.0f, 0.8f,
                              Vector3Double{});
  stableSystemSave[1].addStar(Vector3Double{-20.0, -10.0, 0.0}, 100.0f, 0.8f,
                              Vector3Double{}, BLUE);
  stableSystemSave[1].addStar(Vector3Double{10.0, -30.0, 0.0}, 100.0f, 0.8f,
                              Vector3Double{}, RED);
  stableSystemSave[1].epsilonValue(1000.0, closeCamera);

  stableSystemSave[2].addStar(Vector3Double{10.0, 30.0, 0.0}, 100.0f, 1.0f,
                              Vector3Double{});
  stableSystemSave[2].addStar(Vector3Double{-20.0, -10.0, 0.0}, 100.0f, 1.0f,
                              Vector3Double{}, BLUE);
  stableSystemSave[2].addStar(Vector3Double{10.0, -30.0, 0.0}, 100.0f, 1.0f,
                              Vector3Double{}, RED);
  stableSystemSave[2].addStar(Vector3Double{-5.0, 10.0, 20.0}, 100.0f, 1.0f,
                              Vector3Double{}, PURPLE);
  stableSystemSave[2].epsilonValue(10.0, closeCamera);

  stableSystemSave[3].addStar(Vector3Double{10.0, 60.0, 0.0}, 100.0f, 1.0f,
                              Vector3Double{});
  stableSystemSave[3].addStar(Vector3Double{-20.0, -10.0, 0.0}, 100.0f, 1.0f,
                              Vector3Double{}, BLUE);
  stableSystemSave[3].addStar(Vector3Double{10.0, -30.0, 0.0}, 100.0f, 1.0f,
                              Vector3Double{}, RED);
  stableSystemSave[3].addStar(Vector3Double{-5.0, 50.0, 20.0}, 100.0f, 1.0f,
                              Vector3Double{}, PURPLE);
  stableSystemSave[3].addStar(Vector3Double{-2.0, 6.0, 10.0}, 100.0f, 1.0f,
                              Vector3Double{}, GREEN);
  stableSystemSave[3].epsilonValue(20.0, Vector3{80.0f,80.0f,80.0f});

  stableSystemSave[4].addStar(Vector3Double{10.0, 60.0, 5.0}, 100.0f, 1.0f,
                              Vector3Double{});
  stableSystemSave[4].addStar(Vector3Double{200.0, -10.0, -10.0}, 100.0f, 1.0f,
                              Vector3Double{}, BLUE);
  stableSystemSave[4].addStar(Vector3Double{70.0, -30.0, 20.0}, 100.0f, 1.0f,
                              Vector3Double{}, RED);
  stableSystemSave[4].addStar(Vector3Double{-140.0, 50.0, -20.0}, 100.0f, 1.0f,
                              Vector3Double{}, PURPLE);
  stableSystemSave[4].addStar(Vector3Double{-60.0, 6.0, 10.0}, 100.0f, 1.0f,
                              Vector3Double{}, GREEN);
  stableSystemSave[4].epsilonValue(10000.0, Vector3{2.0f,130.0f,400.0f});
}