#include "raylib.h"
#include "test.h"
#include <cmath>
#include <iostream>
#include <string>
#include <vector>

int main() {

  const int screenWidth = 800;
  const int screenHeight = 800;
  InitWindow(screenWidth, screenHeight, "Raylib basic window");
  SetTargetFPS(60);

  Vector3 spherePosition = {400.0f, 400.0f, 0.0f};

  while (!WindowShouldClose()) {
    BeginDrawing();
    ClearBackground(BLACK);

    DrawSphere(spherePosition, 20.0f, RED);
    EndDrawing();

    std::vector
  }

  CloseWindow();
  return 0;
}