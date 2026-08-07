#include "StarLib.h"
#include "raylib.h"
#include "raymath.h"
#include "settings.h"
#include <iostream>

using std::cout;

// Global array definitions
star stableSystemSave[stableSystemSize];

int main() {
  InitWindow(screenWidth, screenHeight, "3 Body problem");
  InitAudioDevice();
  Music spaceSound = LoadMusicStream("../assest/space.mp3");
  Sound impactSound = LoadSound("../assest/impact.mp3");
  PlayMusicStream(spaceSound);
  SetMusicVolume(spaceSound, MusicVolume); // 2% volume
  initStableSystem();                      // set the stableSys values
                                           // stars setup
  star starsObjInit;
  starsObjInit.epsilonValue(0.01);
  star starsObj = stableSystemSave[0]; // maybe you want to run stableSystem[0],
                                       // so you change value

  // camera setup
  Camera3D camera = {0};
  camera.position = starsObj.cameraVar;
  camera.target = Vector3{};
  camera.up = Vector3{0.0f, 1.0f, 0.0f};
  camera.fovy = 60.0f;
  camera.projection = CAMERA_PERSPECTIVE;

  // vars setup
  float physicsTimer = 0.0f;
  float cameraSpeed = NormalCameraSpeed;

  // mesh setup
  Mesh starMesh = GenMeshSphere(1.0f, 64, 64);
  Model starModel = LoadModelFromMesh(starMesh);

  // shader setup
  Shader starShader = LoadShader("shader.vert", "shader.frag");
  int ViewLoc = GetShaderLocation(starShader, "u_viewPos");
  int ColorLoc = GetShaderLocation(starShader, "u_starColor");
  starModel.materials[0].shader = starShader;

  // gameloop

  while (!WindowShouldClose()) {

    UpdateMusicStream(spaceSound); // to run  the music

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

    // music, to replay music when it stops
    if (!IsMusicStreamPlaying(spaceSound)) {
      PlayMusicStream(spaceSound);
    }

    // fixed-step physics
    physicsTimer += dt;
    while (physicsTimer >= fixedDeltaTime) {
      RK4(starsObj, fixedDeltaTime);
      physicsTimer -= fixedDeltaTime;
    }

    UpdateCameraPro(&camera, cameradirection, rotation, 0.0f);
    if (IsKeyPressed(KEY_F)) {
      camera.target = Vector3{0.0f, 0.0f, 0.0f};
    }
     SetShaderValue(starShader, ViewLoc, &camera.position, SHADER_UNIFORM_VEC3);
    // update the shader giving it the camera position

    // the draw loop
    BeginDrawing();
    BeginMode3D(camera);
    ClearBackground(BLACK);

    DrawGrid(64, 500.0f);
    for (int i = 0; i < starsObj.pos.size(); i++) {
      setStarShaderColor(starShader, ColorLoc, starsObj.color[i]);
      DrawModel(starModel, starsObj.pos[i], starsObj.rad[i], WHITE);
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