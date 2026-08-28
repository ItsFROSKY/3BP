#pragma once
#include "raylib.h"
#include <vector>
using std::vector;

Vector3 convertVcetor3(Vector3 old);

class star {
public:
  // SoA (struct of arrays) for better cache performance
  vector<Vector3> pos;
  vector<float> mass;
  vector<float> rad;         // radius
  vector<Vector3> vel; // velocity
  vector<Vector3> dv;
  vector<Vector3> dp; // change in position
  vector<Color> color;
  double epsilon_squared;
  Vector3 cameraVar;
  vector<float> temp;
  vector<float> luminosity;
  vector<bool> BlackbodyColorActivation; //RGB values for blackbody color

  void addStar(Vector3 position, float newMass, float radius,
               Vector3 velocity = Vector3{0.0, 0.0, 0.0},
               Color newColor = YELLOW, 
               bool blackbodyColor = false, 
               float temperature = 5778.0f, 
               float luminosity = 1.0f);

  // set the epsilon value for the star system, and set the camera position
  void epsilonValue(double epsilon,
                    Vector3 cameraNew = Vector3{800.0f, 800.0f, 800.0f});
};

float pairPressed(int key1, int key2);

void move(Vector3 &original, Vector3 direction, float speed,
          float dt);

void gravity(star &starsObj, Sound &sound);

void applyGravity(star &starsObj, float dt);

Vector3 angleConvert(double angle, float magnitude);

void stableTwoStars(star &stars, float swivel, float tilt, int j, int k);
//create a stable system of two stars, with the ability to swivel and tilt the system, and the ability to choose which two stars to use in the system

void takeInput();

vector<Vector3> measureAcceleration(star &stars, vector<Vector3> tempPos, float dt, vector<Vector3> &DvTemp);

void RK4 (star &stars, float dt);

void setStarShaderColor(Shader starShader, int colorLoc, Color starColor);

Vector3 GetBlackbodyColorCPU(float tempK);



// Declaration (extern - definition in 3bp.cpp)
inline constexpr int stableSystemSize = 5;
extern star stableSystemSave[stableSystemSize];
//creating a global array of stars, stable systems to use in the main program, then going trhough each star system and adding stars to the star system in line 73 of this file

inline constexpr Vector3 closeCamera = {50.0f,50.0f,50.0f};









// Initialization function (no parameters), just saves some stable systems to the global array stableSystemSave
inline void initStableSystem() { 
  stableSystemSave[0].addStar(Vector3{500.0, 50.0, 0.0}, 100.0f, 100.0f,
                              Vector3{}, RED);
  stableSystemSave[0].addStar(Vector3{-100, 200.0, -100.0}, 0.5f, 20.0f,
                              Vector3{0.01, -0.01, 5.0});
  stableSystemSave[0].addStar(Vector3{1100, -200.0, 100.0}, 0.25f, 20.0f,
                              Vector3{-0.01, 0.01, -5.0}, BLUE);
 
  stableSystemSave[0].epsilonValue(0.1f, closeCamera);

  stableSystemSave[1].addStar(Vector3{10.0, 30.0, 0.0}, 100.0f, 0.8f,
                              Vector3{});
  stableSystemSave[1].addStar(Vector3{-20.0, -10.0, 0.0}, 100.0f, 0.8f,
                              Vector3{}, BLUE);
  stableSystemSave[1].addStar(Vector3{10.0, -30.0, 0.0}, 100.0f, 0.8f,
                              Vector3{}, RED);
  stableSystemSave[1].epsilonValue(1000.0, closeCamera);

  stableSystemSave[2].addStar(Vector3{10.0, 30.0, 0.0}, 100.0f, 1.0f,
                              Vector3{});
  stableSystemSave[2].addStar(Vector3{-20.0, -10.0, 0.0}, 100.0f, 1.0f,
                              Vector3{}, BLUE);
  stableSystemSave[2].addStar(Vector3{10.0, -30.0, 0.0}, 100.0f, 1.0f,
                              Vector3{}, RED);
  stableSystemSave[2].addStar(Vector3{-5.0, 10.0, 20.0}, 100.0f, 1.0f,
                              Vector3{}, PURPLE);
  stableSystemSave[2].epsilonValue(10.0, closeCamera);

  stableSystemSave[3].addStar(Vector3{10.0, 60.0, 0.0}, 100.0f, 1.0f,
                              Vector3{});
  stableSystemSave[3].addStar(Vector3{-20.0, -10.0, 0.0}, 100.0f, 1.0f,
                              Vector3{}, BLUE);
  stableSystemSave[3].addStar(Vector3{10.0, -30.0, 0.0}, 100.0f, 1.0f,
                              Vector3{}, RED);
  stableSystemSave[3].addStar(Vector3{-5.0, 50.0, 20.0}, 100.0f, 1.0f,
                              Vector3{}, PURPLE);
  stableSystemSave[3].addStar(Vector3{-2.0, 6.0, 10.0}, 100.0f, 1.0f,
                              Vector3{}, GREEN);
  stableSystemSave[3].epsilonValue(20.0, Vector3{80.0f,80.0f,80.0f});

  stableSystemSave[4].addStar(Vector3{10.0, 60.0, 5.0}, 100.0f, 1.0f,
                              Vector3{});
  stableSystemSave[4].addStar(Vector3{200.0, -10.0, -10.0}, 100.0f, 1.0f,
                              Vector3{}, BLUE);
  stableSystemSave[4].addStar(Vector3{70.0, -30.0, 20.0}, 100.0f, 1.0f,
                              Vector3{}, RED);
  stableSystemSave[4].addStar(Vector3{-140.0, 50.0, -20.0}, 100.0f, 1.0f,
                              Vector3{}, PURPLE);
  stableSystemSave[4].addStar(Vector3{-60.0, 6.0, 10.0}, 100.0f, 1.0f,
                              Vector3{}, GREEN);
  stableSystemSave[4].epsilonValue(10000.0, Vector3{2.0f,130.0f,400.0f});
}