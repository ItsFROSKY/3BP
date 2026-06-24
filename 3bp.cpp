#include "StarLib.h"
#include "raylib.h"
#include "settings.h"
#include <iostream>

using std::cout;

int main() {
  InitWindow(screenWidth, screenHeight, "Raylib basic window");

  // camera setup
  Camera3D camera = {0};
  camera.position = Vector3{400.0f, 400.0f, 400.0f};
  camera.target = Vector3{0.0f, 0.0f, 0.0f};
  camera.up = Vector3{0.0f, 1.0f, 0.0f};
  camera.fovy = 45.0f;
  camera.projection = CAMERA_PERSPECTIVE;
  star starsObj;
  starsObj.addStar(Vector3{0.0f, 25.0f, 0.0f}, 1.0f, 1.0f, 0.0f);

  Mesh starMesh = GenMeshSphere(20.0f, 64, 64);
  Model starModel = LoadModelFromMesh(starMesh);

  while (!WindowShouldClose()) {



     // input and movement for camera
    Vector3 cameradirection =
        Vector3{pairPressed(KEY_W, KEY_S)*cameraSpeed, pairPressed(KEY_D, KEY_A)*cameraSpeed,
                pairPressed(KEY_Q, KEY_E)*cameraSpeed};
    Vector2 mouseDelta = GetMouseDelta();
    Vector3 rotation = {mouseDelta.x * mouseSensitivity,
                        mouseDelta.y * mouseSensitivity, 0.0f};
    // update loop
    float dt = GetFrameTime() * simulationSpeed;

    UpdateCameraPro(&camera, cameradirection, rotation, 0.0f);
    if (IsKeyPressed(KEY_F)) {
      camera.target = Vector3{0.0f, 0.0f, 0.0f};
    }

    //the draw loop
    BeginDrawing();
    BeginMode3D(camera);
    ClearBackground(BLACK);

   
    DrawGrid(64, 1.0f);
    DrawModel(starModel, starsObj.pos[0], starsObj.rad[0], starsObj.color[0]);
    EndMode3D();
    EndDrawing();
  }

  CloseWindow();
  return 0;
}