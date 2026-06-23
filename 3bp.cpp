#include "StarLib.h"
#include "raylib.h"
#include "settings.h"
#include <iostream>

using std::cout;

int main() {
  InitWindow(screenWidth, screenHeight, "Raylib basic window");

  // camera setup
  Camera3D camera = {0};
  camera.position = {0.0f, 0.0f, 400.0f};
  camera.target = Vector3{};
  camera.up = Vector3{0.0f, 1.0f, 0.0f};
  camera.fovy = 45.0f;
  camera.projection = CAMERA_PERSPECTIVE;
  star starsObj;
  starsObj.addStar(Vector3{}, 1.0f, 1.0f, 0.0f);

  Mesh starMesh = GenMeshSphere(20.0f, 64, 64);
  Model starModel = LoadModelFromMesh(starMesh);

  while (!WindowShouldClose()) {



     // input and movement for camera
    Vector3 cameradirection =
        Vector3{pairPressed(KEY_D, KEY_A), pairPressed(KEY_E, KEY_Q),
                pairPressed(KEY_W, KEY_S)};
    Vector2 mouseDelta = GetMouseDelta();
    Vector3 rotation = {mouseDelta.y * mouseSensitivity,
                        mouseDelta.x * mouseSensitivity, 0.0f};

    Vector3 cameraNewPos = camera.position;
    // update loop
    float dt = GetFrameTime() * simulationSpeed;
    move(cameraNewPos, cameradirection, 100.0f, dt);
    UpdateCameraPro(&camera, cameraNewPos, rotation, 0.0f);

    cout<<Vector3{ cameraNewPos.x, cameraNewPos.y, cameraNewPos.z}.x<<std::endl;

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