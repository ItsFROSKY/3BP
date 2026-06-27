#include "StarLib.h"
#include "raylib.h"
#include "settings.h"
#include "raymath.h"
#include <iostream>
using std::cout;

int main() {
  InitWindow(screenWidth, screenHeight, "3 Body problem");
  InitAudioDevice();
Music spaceSound = LoadMusicStream("../assest/space.mp3");
Sound impactSound = LoadSound("../assest/impact.mp3");
PlayMusicStream(spaceSound);
SetMusicVolume(spaceSound, MusicVolume); // 2% volume

  // camera setup
  Camera3D camera = {0};
  camera.position = Vector3{800.0f, 800.0f, 800.0f};
  camera.target = Vector3{};
  camera.up = Vector3{0.0f, 1.0f, 0.0f};
  camera.fovy = 45.0f;
  camera.projection = CAMERA_PERSPECTIVE;
  //0.0 is double, 0.0f is float

  // stars setup
  star starsObj;
  starsObj.addStar(Vector3Double{-100, 200.0, -100.0}, 0.5f, 1.0f, Vector3Double{0.01, -0.01, 5.0});
  starsObj.addStar(Vector3Double{1100, -200.0, 100.0}, 0.25f, 1.0f, Vector3Double{-0.01, 0.01, -5.0}, BLUE);
  starsObj.addStar(Vector3Double{500.0, 50.0, 0.0}, 100.0f, 5.0f, Vector3Double{}, RED);
  //stableTwoStars(starsObj, 90.0f, 90.0f, 0, 1);

  // vars setup
  float physicsTimer = 0.0f;
  float cameraSpeed = NormalCameraSpeed;

  // mesh setup
  Mesh starMesh = GenMeshSphere(20.0f, 64, 64);
  Model starModel = LoadModelFromMesh(starMesh);

  // gameloop

  while (!WindowShouldClose()) {

    UpdateMusicStream(spaceSound); //to run  the music

    // input and movement for camera
    Vector3 cameradirection = Vector3{pairPressed(KEY_W, KEY_S) * cameraSpeed,
                                      pairPressed(KEY_D, KEY_A) * cameraSpeed,
                                      pairPressed(KEY_Q, KEY_E) * cameraSpeed};
    Vector2 mouseDelta = GetMouseDelta();
    Vector3 rotation = {mouseDelta.x * mouseSensitivity,
                        mouseDelta.y * mouseSensitivity, 0.0f};

    if (IsKeyDown(KEY_LEFT_SHIFT))
      cameraSpeed = 1.25f;
    else
      cameraSpeed = NormalCameraSpeed;

    // update loop
    float dt = GetFrameTime() * simulationSpeed;

    //music, to replay music when it stops
    if (!IsMusicStreamPlaying(spaceSound)) {
        PlayMusicStream(spaceSound);
    }

    // fixed-step physics
    physicsTimer += dt;
    while (physicsTimer >= fixedDeltaTime) {
      gravity(starsObj, impactSound);
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

    DrawGrid(64, 500.0f);
    for (int i = 0; i < starsObj.pos.size(); i++) {
      DrawModel(starModel, convertVcetor3(starsObj.pos[i]), starsObj.rad[i], starsObj.color[i]);
    }

    EndMode3D();
    DrawFPS(100, 100);
    EndDrawing();
  }

UnloadMusicStream(spaceSound);
UnloadSound(impactSound);
CloseAudioDevice();
CloseWindow();
return 0;
}