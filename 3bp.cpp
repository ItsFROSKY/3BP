#include "StarLib.h"
#include "raylib.h"
#include "raymath.h"
#include "settings.h"
#include <iostream>
#include "rlgl.h"

using std::cout;

// Global array definitions
star stableSystemSave[stableSystemSize];

extern "C" {
    __declspec(dllexport) unsigned long NvOptimusEnablement = 0x00000001;
}



int main() {

  SetConfigFlags(FLAG_WINDOW_RESIZABLE | FLAG_BORDERLESS_WINDOWED_MODE);
  InitWindow(GetMonitorWidth(0), GetMonitorHeight(0), "3 Body problem");
  int screenWidth = GetScreenWidth();
  int screenHeight = GetScreenHeight();
  DisableCursor();
  InitAudioDevice();
  Music spaceSound = LoadMusicStream("../assest/space.mp3");
  Sound impactSound = LoadSound("../assest/impact.mp3");
  PlayMusicStream(spaceSound);
  SetMusicVolume(spaceSound, MusicVolume); // 2% volume
  initStableSystem();                      // set the stableSys values
                                           // stars setup
  star starsObjInit;
  starsObjInit.epsilonValue(0.01); //idk, i think it does smth lol sry
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






//shader setup
Shader starShader    = LoadShader("shaders/shader.vert", "shaders/shader.frag");
Shader coronaShader  = LoadShader("shaders/corona/corona.frag", "shaders/corona/corona.frag");
Shader skyShader     = LoadShader(0, "shaders/sky_background.frag");
Shader extractShader = LoadShader(0, "shaders/bloom/bloom_extract.frag");
Shader blurHShader   = LoadShader(0, "shaders/bloom_blur_h.frag");
Shader blurVShader   = LoadShader(0, "shaders/bloom_blur_v.frag");
Shader postShader    = LoadShader(0, "shaders/post_final.frag");

int starViewPosLoc  = GetShaderLocation(starShader, "u_viewPos");
int starTimeLoc     = GetShaderLocation(starShader, "u_time");
int starBbLoc       = GetShaderLocation(starShader, "u_blackbodyColor");
int starLumiLoc     = GetShaderLocation(starShader, "u_luminosity");
int starColorLoc    = GetShaderLocation(starShader, "u_starColor");
int starUseBbLoc = GetShaderLocation(starShader, "u_useBlackbody");

int coronaViewPosLoc = GetShaderLocation(coronaShader, "u_viewPos");
int coronaTimeLoc    = GetShaderLocation(coronaShader, "u_time");
int coronaBbLoc      = GetShaderLocation(coronaShader, "u_blackbodyColor");
int coronaLumiLoc    = GetShaderLocation(coronaShader, "u_luminosity");
int coronaScaleLoc   = GetShaderLocation(coronaShader, "u_shellScale");

int skyResLoc        = GetShaderLocation(skyShader, "u_resolution");
int skyCamDirLoc     = GetShaderLocation(skyShader, "u_cameraDir");
int skyTimeLoc       = GetShaderLocation(skyShader, "u_time");

int blurHWidthLoc    = GetShaderLocation(blurHShader, "u_renderWidth");
int blurVHeightLoc   = GetShaderLocation(blurVShader, "u_renderHeight");

int postToneLoc      = GetShaderLocation(postShader, "u_toneMapMode");
int postIntensityLoc = GetShaderLocation(postShader, "u_bloomIntensity");
int postExposureLoc  = GetShaderLocation(postShader, "u_exposure");

    //Resolution uniforms
float renderW = (float)screenWidth;
float renderH = (float)screenHeight;
Vector2 resVec = { renderW, renderH };
SetShaderValue(blurHShader, GetShaderLocation(blurHShader, "u_renderWidth"), &renderW, SHADER_UNIFORM_FLOAT);
SetShaderValue(blurVShader, GetShaderLocation(blurVShader, "u_renderHeight"), &renderH, SHADER_UNIFORM_FLOAT);
SetShaderValue(skyShader, GetShaderLocation(skyShader, "u_resolution"), &resVec, SHADER_UNIFORM_VEC2);

//Post processing default toggles
int toneMapMode = 1; //1 = ACES Film, 0 = Reinhard
float bloomIntensity = 1.2f;
float exposure = 1.0f;

//HDR and bloom buffers
RenderTexture2D hdrTarget = LoadRenderTexture(screenWidth, screenHeight);
RenderTexture2D bloomPing = LoadRenderTexture(screenWidth, screenHeight);
RenderTexture2D bloomPong = LoadRenderTexture(screenWidth, screenHeight);

SetShaderValue(postShader, GetShaderLocation(postShader, "u_toneMapMode"), &toneMapMode, SHADER_UNIFORM_INT);
SetShaderValue(postShader, GetShaderLocation(postShader, "u_bloomIntensity"), &bloomIntensity, SHADER_UNIFORM_FLOAT);
SetShaderValue(postShader, GetShaderLocation(postShader, "u_exposure"), &exposure, SHADER_UNIFORM_FLOAT);





// Fetch Uniform Locations
int ViewLoc = GetShaderLocation(starShader, "u_viewPos");
int ColorLoc = GetShaderLocation(starShader, "u_starColor");
int timeLoc      = GetShaderLocation(starShader, "u_time");

starModel.materials[0].shader = starShader;



// gameloop

while (!WindowShouldClose()) {

  UpdateMusicStream(spaceSound); // to run  the music
  float dt = (float)GetFrameTime();

  // input and movement for camera
  if (IsKeyDown(KEY_LEFT_SHIFT))
    cameraSpeed = FastCameraSpeed;
  else
    cameraSpeed = NormalCameraSpeed;

  Vector3 cameradirection = Vector3{pairPressed(KEY_W, KEY_S) * (cameraSpeed *dt),
                                    pairPressed(KEY_D, KEY_A) * (cameraSpeed *dt),
                                    pairPressed(KEY_Q, KEY_E) * (cameraSpeed *dt)};
  Vector2 mouseDelta = GetMouseDelta();
  Vector3 rotation = {mouseDelta.x * mouseSensitivity,
                      mouseDelta.y * mouseSensitivity, 0.0f};

  float time = (float)GetTime();

  SetShaderValue(skyShader, timeLoc, &time,SHADER_UNIFORM_FLOAT);

  Vector2 resolution = {(float)GetScreenWidth(), (float)GetScreenHeight()};

  SetShaderValue(skyShader, skyResLoc, &resolution,SHADER_UNIFORM_VEC2);

  // update loop
  float dt_sim = dt* simulationSpeed;
  UpdateCameraPro(&camera, cameradirection, rotation, 0.0f);
  Vector3 camDir = Vector3Normalize(Vector3Subtract(camera.target, camera.position));
  SetShaderValue(skyShader, GetShaderLocation(skyShader, "u_cameraDir"), &camDir, SHADER_UNIFORM_VEC3);
  if (IsKeyPressed(KEY_F)) {
    camera.target = Vector3{0.0f, 0.0f, 0.0f};
  }


  // Update Global Uniforms
  Vector3 camForward = Vector3Normalize(Vector3Subtract(camera.target, camera.position));
  float floatCurrentTime = swirlFactor * time;
  float ShadertTime = fmodf(floatCurrentTime, 1000.0f);
  SetShaderValue(starShader, timeLoc, &ShadertTime, SHADER_UNIFORM_FLOAT);
  SetShaderValue(starShader, ViewLoc, &camera.position, SHADER_UNIFORM_VEC3);

  SetShaderValue(skyShader, skyCamDirLoc, &camForward, SHADER_UNIFORM_VEC3);
  SetShaderValue(skyShader, skyTimeLoc, &ShadertTime, SHADER_UNIFORM_FLOAT);
  // update the shader giving it the camera position

  // music, to replay music when it stops
  if (!IsMusicStreamPlaying(spaceSound)) {
    PlayMusicStream(spaceSound);
  }

  // fixed-step physics
  physicsTimer += dt_sim;
  while (physicsTimer >= fixedDeltaTime && maxRK4steps >0) {
    RK4(starsObj, fixedDeltaTime);
    physicsTimer -= fixedDeltaTime;
  }



  // the draw loop
  BeginDrawing();
  BeginTextureMode(hdrTarget);
  ClearBackground(BLACK);

  // 2D Fullscreen Procedural Sky (Replaces ClearBackground color)
  BeginShaderMode(skyShader);
  DrawRectangle(0, 0, screenWidth, screenHeight, WHITE);
  EndShaderMode();

  BeginMode3D(camera);

  if (drawGridBool) //a bool for drawings white grid lines
  DrawGrid(64, 500.0f);

  for (int i = 0; i < starsObj.pos.size(); i++) {
    Vector3 bbColor;
    if(starsObj.BlackbodyColorActivation[i])
      bbColor = starsObj.BBColor[i];

      else bbColor = starsObj.ColorNormalized[i];
      
    float luminosity = starsObj.luminosity[i];

    // Set Photosphere Uniforms
    int useBB = (int)starsObj.BlackbodyColorActivation[i];
    SetShaderValue(starShader, starUseBbLoc, &useBB, SHADER_UNIFORM_INT);
    SetShaderValue(starShader, starBbLoc, &bbColor, SHADER_UNIFORM_VEC3);
    SetShaderValue(starShader, starLumiLoc, &luminosity, SHADER_UNIFORM_FLOAT);
    
    // DRAW YOUR STAR MODEL AS USUAL
    starModel.materials[0].shader = starShader;
    DrawModel(starModel, starsObj.pos[i], starsObj.rad[i], WHITE);

    // DRAW ADDITIVE CORONA SHELLS
    starModel.materials[0].shader = coronaShader;
    SetShaderValue(coronaShader, coronaBbLoc, &bbColor, SHADER_UNIFORM_VEC3);
    SetShaderValue(coronaShader, coronaLumiLoc, &luminosity, SHADER_UNIFORM_FLOAT);

    rlDisableDepthMask();
    BeginBlendMode(BLEND_ADDITIVE);
        float shellScales[3] = { 1.08f, 1.16f, 1.24f };
        for (float scale : shellScales) {
            SetShaderValue(coronaShader, coronaScaleLoc, &scale, SHADER_UNIFORM_FLOAT);
            DrawModelEx(starModel, starsObj.pos[i], {0, 1, 0}, 0.0f, 
                        {starsObj.rad[i], starsObj.rad[i], starsObj.rad[i]}, WHITE);
        }
    EndBlendMode();
    rlEnableDepthMask();


  }

  EndMode3D();
  EndTextureMode();

  // --- PASS 2: BLOOM EXTRACTION ---
BeginTextureMode(bloomPing);
  BeginShaderMode(extractShader);
      DrawTextureRec(hdrTarget.texture, (Rectangle){ 0, 0, (float)hdrTarget.texture.width, (float)-hdrTarget.texture.height }, (Vector2){ 0, 0 }, WHITE);
  EndShaderMode();
EndTextureMode();

// --- PASS 3: GAUSSIAN BLUR (H + V) ---
BeginTextureMode(bloomPong);
  BeginShaderMode(blurHShader);
      DrawTextureRec(bloomPing.texture, (Rectangle){ 0, 0, (float)bloomPing.texture.width, (float)-bloomPing.texture.height }, (Vector2){ 0, 0 }, WHITE);
  EndShaderMode();
EndTextureMode();

BeginTextureMode(bloomPing);
  BeginShaderMode(blurVShader);
      DrawTextureRec(bloomPong.texture, (Rectangle){ 0, 0, (float)bloomPong.texture.width, (float)-bloomPong.texture.height }, (Vector2){ 0, 0 }, WHITE);
  EndShaderMode();
EndTextureMode();

// --- PASS 4: FINAL SCREEN DRAW (TONE MAPPING & COMPOSITE) ---
BeginDrawing();
    ClearBackground(BLACK);

    rlActiveTextureSlot(1);
    rlEnableTexture(bloomPing.texture.id); // Bind bloom blur texture to unit 1

    BeginShaderMode(postShader);
        DrawTextureRec(hdrTarget.texture, (Rectangle){ 0, 0, (float)hdrTarget.texture.width, (float)-hdrTarget.texture.height }, (Vector2){ 0, 0 }, WHITE);
    EndShaderMode();

    rlActiveTextureSlot(1);
    rlDisableTexture();
    rlActiveTextureSlot(0);


    DrawFPS(100, 100);
    EndDrawing();
  }

  //unload and close
  /*
  UnloadRenderTexture(hdrTarget);
  UnloadRenderTexture(bloomPing);
  UnloadRenderTexture(bloomPong);

  UnloadShader(starShader);
  UnloadShader(coronaShader);
  UnloadShader(skyShader);
  UnloadShader(extractShader);
  UnloadShader(blurHShader);
  UnloadShader(blurVShader);
  UnloadShader(postShader);

  UnloadModel(starModel); 
  UnloadShader(starShader);
  UnloadMesh(starMesh); */

  UnloadMusicStream(spaceSound);
  UnloadSound(impactSound); 
  CloseAudioDevice();
  CloseWindow();
  return 0;
}