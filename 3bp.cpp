#include "StarLib.h"
#include "raylib.h"
#include "settings.h"
#include <iostream>

int main() {
  InitWindow(screenWidth, screenHeight, "Raylib basic window");

  // camera setup
  Camera3D camera = {0};
  camera.position = {400.0f, 400.0f, 400.0f};
  camera.target = Vector3{};
  camera.up = Vector3{0.0f, 1.0f, 0.0f};
  camera.fovy = 45.0f;
  camera.projection = CAMERA_PERSPECTIVE;
  star starsObj;
  starsObj.addStar(Vector3{}, 1.0f, 1.0f, 0.0f);

  Mesh starMesh = GenMeshSphere(20.0f, 64, 64);
  Model starModel = LoadModelFromMesh(starMesh);

  while (!WindowShouldClose()) {
    BeginDrawing();
    BeginMode3D(camera);
    ClearBackground(BLACK);

    DrawModel(starModel, starsObj.pos[0], starsObj.rad[0], starsObj.color[0]);
    EndMode3D();
    EndDrawing();
  }

  CloseWindow();
  return 0;
}