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
  starsObj.addStar(Vector3{0.0f, 25.0f, 0.0f}, 1.0f, 1.0f, angleConvert(45.0f, 10.0f));
  starsObj.addStar(Vector3{300.0f, 25.0f, 0.0f}, 10.0f, 1.0f, Vector3{0.0f, 0.0f, 0.0f} , RED);
  stableTwoStars(starsObj);
  float physicsTimer = 0.0f;

  Mesh starMesh = GenMeshSphere(20.0f, 64, 64);
  Model starModel = LoadModelFromMesh(starMesh);

  while (!WindowShouldClose()) {

    // input and movement for camera
    Vector3 cameradirection = Vector3{pairPressed(KEY_W, KEY_S) * cameraSpeed,
                                      pairPressed(KEY_D, KEY_A) * cameraSpeed,
                                      pairPressed(KEY_Q, KEY_E) * cameraSpeed};
    Vector2 mouseDelta = GetMouseDelta();
    Vector3 rotation = {mouseDelta.x * mouseSensitivity,
                        mouseDelta.y * mouseSensitivity, 0.0f};
    // update loop
    float dt = GetFrameTime() * simulationSpeed;

    //fixed-step physics
    physicsTimer += dt;
    while(physicsTimer >= fixedDeltaTime) {
      gravity(starsObj);
      applyGravity(starsObj, fixedDeltaTime);
      physicsTimer -= fixedDeltaTime;
    }

    UpdateCameraPro(&camera, cameradirection, rotation, 0.0f);
    if (IsKeyPressed(KEY_F)) {
      camera.target = Vector3{0.0f, 0.0f, 0.0f};
    }

    // the draw loop
    BeginDrawing();
    BeginMode3D(camera);
    ClearBackground(BLACK);

    //DrawGrid(64, 500.0f);
    for (int i = 0; i < starsObj.pos.size(); i++) {
      DrawModel(starModel, starsObj.pos[i], starsObj.rad[i], starsObj.color[i]);
    }
    float k = 1000;
    float jn = 00;


    DrawLine3D(Vector3{k,0,0}, Vector3{-k,0,0}, RED);
    DrawLine3D(Vector3{0,0,k}, Vector3{0,0,-k}, GREEN);

    EndMode3D();
    EndDrawing();
  }

  CloseWindow();
  return 0;
}