#include "StarLib.h"
#include "raylib.h"
#include "raymath.h"
#include "settings.h"
#include <iostream>
#include "rlgl.h"
#include <cstdio>
#include <filesystem>
#include <ctime>

#ifdef _WIN32
#define popen _popen
#define pclose _pclose
#endif

FILE* ffmpegPipe = nullptr;
bool isRecording = false;
int renderWidth = 2560;  //recording target width
int renderHeight = 1440; //recording target height

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
  //SetTargetFPS(144);
  InitAudioDevice();
  Music spaceSound = LoadMusicStream("../assest/space.mp3");
  Sound impactSound = LoadSound("../assest/impact.mp3");
  PlayMusicStream(spaceSound);
  SetMusicVolume(spaceSound, MusicVolume); // 2% volume
  initStableSystem();                      // set the stableSys values
                                           // stars setup
  star starsObjInit;
  starsObjInit.epsilonValue(0.01); //idk, i think it does smth lol sry
  star starsObj = stableSystemSave[Stable_system_runNum]; // maybe you want to run stableSystem[0],
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
Shader coronaShader = LoadShader("C:/frosky/Dev/3BP/shaders/corona/corona.vert", "C:/frosky/Dev/3BP/shaders/corona/corona.frag");
Shader skyShader     = LoadShader(0, "shaders/sky_background.frag");
Shader extractShader = LoadShader(0, "shaders/bloom/bloom_extract.frag");
Shader blurHShader   = LoadShader(0, "shaders/bloom_blur_h.frag");
Shader blurVShader   = LoadShader(0, "shaders/bloom_blur_v.frag");
Shader postShader    = LoadShader(0, "shaders/post_final.frag");
Shader flameShader = LoadShader("shaders/flames/star_flames.vert", "shaders/flames/star_flames.frag");
TraceLog(LOG_INFO, "Loading wide vertex: %s", "shaders/flames/star_flames_wide.vert");
TraceLog(LOG_INFO, "Loading wide fragment: %s", "shaders/flames/starFlameWide.frag");



Shader flameShaderWide = LoadShader("shaders/flames/star_flames_wide.vert", "shaders/flames/starFlameWide.frag");

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

int flameViewLoc = GetShaderLocation(flameShader, "u_viewPos");
int flameTimeLoc = GetShaderLocation(flameShader, "u_time");
int flameColorLoc = GetShaderLocation(flameShader, "u_starColor");
int flameLumiLoc = GetShaderLocation(flameShader, "u_luminosity");

int flameViewLocWide = GetShaderLocation(flameShaderWide, "u_viewPos");
int flameTimeLocWide = GetShaderLocation(flameShaderWide, "u_time");
int flameColorLocWide = GetShaderLocation(flameShaderWide, "u_starColor");
int flameLumiLocWide = GetShaderLocation(flameShaderWide, "u_luminosity");

int postHdrLoc   = GetShaderLocation(postShader, "u_hdrScene");
int postBloomLoc = GetShaderLocation(postShader, "u_bloomBlur");

int hdrUnit = 0;
int bloomUnit = 1;

    //Resolution uniforms
float renderW = (float)screenWidth;
float renderH = (float)screenHeight;
Vector2 resVec = { renderW, renderH };
SetShaderValue(blurHShader, GetShaderLocation(blurHShader, "u_renderWidth"), &renderW, SHADER_UNIFORM_FLOAT);
SetShaderValue(blurVShader, GetShaderLocation(blurVShader, "u_renderHeight"), &renderH, SHADER_UNIFORM_FLOAT);
SetShaderValue(skyShader, skyCamDirLoc, &resVec, SHADER_UNIFORM_VEC2);

//Post processing default toggles
int toneMapMode = 1; //1 = ACES Film, 0 = Reinhard
float bloomIntensity = 1.2f;
float exposure = 1.0f;

// Offscreen target for final post-processed video frame capture
RenderTexture2D finalTarget = LoadRenderTexture(renderWidth, renderHeight);
RenderTexture2D hdrTarget   = LoadRenderTexture(renderWidth, renderHeight);
RenderTexture2D bloomPing   = LoadRenderTexture(renderWidth, renderHeight);
RenderTexture2D bloomPong   = LoadRenderTexture(renderWidth, renderHeight);

//helper lambda func (resize render targets dynamically)
auto ResizeRenderTargets = [&](int newW, int newH) {
    if (isRecording) return; //locks resolution changes during recording
    renderWidth = newW;
    renderHeight = newH;

    UnloadRenderTexture(hdrTarget);
    UnloadRenderTexture(bloomPing);
    UnloadRenderTexture(bloomPong);
    UnloadRenderTexture(finalTarget);

    hdrTarget   = LoadRenderTexture(renderWidth, renderHeight);
    bloomPing   = LoadRenderTexture(renderWidth, renderHeight);
    bloomPong   = LoadRenderTexture(renderWidth, renderHeight);
    finalTarget = LoadRenderTexture(renderWidth, renderHeight);

    float nw = (float)renderWidth;
    float nh = (float)renderHeight;
    Vector2 nRes = { nw, nh };

    SetShaderValue(blurHShader, blurHWidthLoc, &nw, SHADER_UNIFORM_FLOAT);
    SetShaderValue(blurVShader, blurVHeightLoc, &nh, SHADER_UNIFORM_FLOAT);
    SetShaderValue(skyShader, skyResLoc, &nRes, SHADER_UNIFORM_VEC2);

    TraceLog(LOG_INFO, ">>> RECORDING RESOLUTION CHANGED TO: %dx%d", renderWidth, renderHeight);
};

SetShaderValue(postShader, GetShaderLocation(postShader, "u_toneMapMode"), &toneMapMode, SHADER_UNIFORM_INT);
SetShaderValue(postShader, GetShaderLocation(postShader, "u_bloomIntensity"), &bloomIntensity, SHADER_UNIFORM_FLOAT);
SetShaderValue(postShader, GetShaderLocation(postShader, "u_exposure"), &exposure, SHADER_UNIFORM_FLOAT);

SetShaderValue(postShader, postHdrLoc, &hdrUnit, SHADER_UNIFORM_INT);
SetShaderValue(postShader, postBloomLoc, &bloomUnit, SHADER_UNIFORM_INT);





//fetch uniform locations
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

//resultion hotkeys
if (!isRecording) {
    if (IsKeyPressed(KEY_F1)) ResizeRenderTargets(GetMonitorWidth(0), GetMonitorHeight(0)); // Native 2K
    if (IsKeyPressed(KEY_F2)) ResizeRenderTargets(1920, 1080);                             //1080p
    if (IsKeyPressed(KEY_F3)) ResizeRenderTargets(1280, 720);                              //720p
    if (IsKeyPressed(KEY_F4)) ResizeRenderTargets(854, 480);                               //480p
}

//screenshot controls (hotkey M)
if (IsKeyPressed(KEY_M)) {
    std::filesystem::create_directories("../Videos_export");
    Image screenshot = LoadImageFromTexture(finalTarget.texture);
    ImageFlipVertical(&screenshot);
    ExportImage(screenshot, TextFormat("../Videos_export/screenshot_%d.png", (int)GetTime()));
    UnloadImage(screenshot);
    TraceLog(LOG_INFO, ">>> HIGH QUALITY SCREENSHOT SAVED!");
}

//time stop function
if (IsKeyPressed(KEY_T)) {
    if(simulationSpeed != 0.0f)
    simulationSpeed = 0.0f;

    else
    simulationSpeed = simulationSpeedReal;
}


//recording control (hotley R)
if (IsKeyDown(KEY_R)) {
    isRecording = !isRecording;
    if (isRecording) {
        std::filesystem::create_directories("../Videos_export");
        
        //paste step
        long timestamp = (long)time(nullptr);
        char cmd[512];
        snprintf(cmd, sizeof(cmd),
            "ffmpeg -y -f rawvideo -vcodec rawvideo -s %dx%d -pix_fmt rgba -r 60 -i - "
            "-c:v libx264 -preset ultrafast -crf 18 -pix_fmt yuv420p ../Videos_export/video_%ld.mp4",
            renderWidth, renderHeight, timestamp
        );
        
        ffmpegPipe = popen(cmd, "wb");
        if (!ffmpegPipe) {
            TraceLog(LOG_ERROR, ">>> FAILED TO OPEN FFMPEG PIPE!");
            isRecording = false;
        } else {
            TraceLog(LOG_INFO, ">>> RECORDING STARTED AT %dx%d...", renderWidth, renderHeight);
        }
    } else {
        if (ffmpegPipe) {
            pclose(ffmpegPipe);
            ffmpegPipe = nullptr;
        }
        TraceLog(LOG_INFO, ">>> RECORDING STOPPED. VIDEO SAVED TO ../Videos_export/");
    }
}

  float time = (float)GetTime();

  Vector2 resolution = {(float)renderWidth, (float)renderHeight};

  SetShaderValue(skyShader, skyResLoc, &resolution,SHADER_UNIFORM_VEC2);

  // update loop
  float dt_sim = dt* simulationSpeed;
  UpdateCameraPro(&camera, cameradirection, rotation, 0.0f);
  Vector3 camDir = Vector3Normalize(Vector3Subtract(camera.target, camera.position));
  SetShaderValue(skyShader, skyCamDirLoc, &camDir, SHADER_UNIFORM_VEC3);
  if (IsKeyPressed(KEY_F)) {
    camera.target = Vector3{0.0f, 0.0f, 0.0f};
  }


  // update Global Uniforms
  Vector3 camForward = Vector3Normalize(Vector3Subtract(camera.target, camera.position));
  float floatCurrentTime = swirlFactor * time;
  float ShadertTime = fmodf(floatCurrentTime, 1000.0f);
  SetShaderValue(starShader, timeLoc, &ShadertTime, SHADER_UNIFORM_FLOAT);
  SetShaderValue(starShader, ViewLoc, &camera.position, SHADER_UNIFORM_VEC3);

  SetShaderValue(skyShader, skyTimeLoc, &ShadertTime, SHADER_UNIFORM_FLOAT);
  // update the shader giving it the camera position

  //set falmes uniforms
  SetShaderValue(flameShader, flameViewLoc, &camera.position, SHADER_UNIFORM_VEC3);
  SetShaderValue(flameShader, flameTimeLoc, &ShadertTime, SHADER_UNIFORM_FLOAT);

  SetShaderValue(flameShaderWide, flameViewLocWide, &camera.position, SHADER_UNIFORM_VEC3);
  SetShaderValue(flameShaderWide, flameTimeLocWide, &ShadertTime, SHADER_UNIFORM_FLOAT);


  // music, to replay music when it stops
  if (!IsMusicStreamPlaying(spaceSound)) {
    PlayMusicStream(spaceSound);
  }

  // fixed-step physics
  if (isRecording) {
      //offline lockstep
      RK4(starsObj, fixedDeltaTime);

      if (drawTailOnOff) {
          float minRecordDist = deleteTailBool ? 0.001f : Trail_update_NoDelete;
          for (int i = 0; i < starsObj.pos.size(); i++) {
              if (starsObj.trail[i].empty() || Vector3Distance(starsObj.trail[i].back(), starsObj.pos[i]) > minRecordDist) {
                  starsObj.trail[i].push_back(starsObj.pos[i]);
              }
              if (deleteTailBool) {
                  float accumulatedDistance = 0.0f;
                  int popCount = 0;
                  for (int j = (int)starsObj.trail[i].size() - 1; j > 0; j--) {
                      accumulatedDistance += Vector3Distance(starsObj.trail[i][j], starsObj.trail[i][j - 1]);
                      if (accumulatedDistance > TARGET_TRAIL_LENGTH) {
                          popCount = j;
                          break;
                      }
                  }
                  while (popCount > 0 && !starsObj.trail[i].empty()) {
                      starsObj.trail[i].pop_front();
                      popCount--;
                  }
              }
          }
      }
  } else {
      //live execution
      physicsTimer += dt_sim;
      while (physicsTimer >= fixedDeltaTime) {
          RK4(starsObj, fixedDeltaTime);
          physicsTimer -= fixedDeltaTime;
      }

      if (drawTailOnOff) {
          float minRecordDist = deleteTailBool ? 0.001f : Trail_update_NoDelete;
          for (int i = 0; i < starsObj.pos.size(); i++) {
              if (starsObj.trail[i].empty() || Vector3Distance(starsObj.trail[i].back(), starsObj.pos[i]) > minRecordDist) {
                  starsObj.trail[i].push_back(starsObj.pos[i]);
              }
              if (deleteTailBool) {
                  float accumulatedDistance = 0.0f;
                  int popCount = 0;
                  for (int j = (int)starsObj.trail[i].size() - 1; j > 0; j--) {
                      accumulatedDistance += Vector3Distance(starsObj.trail[i][j], starsObj.trail[i][j - 1]);
                      if (accumulatedDistance > TARGET_TRAIL_LENGTH) {
                          popCount = j;
                          break;
                      }
                  }
                  while (popCount > 0 && !starsObj.trail[i].empty()) {
                      starsObj.trail[i].pop_front();
                      popCount--;
                  }
              }
          }
      }
  }




  //the draw loop
  BeginDrawing();
  BeginTextureMode(hdrTarget);
  ClearBackground(BLACK);

  //2D fullscreen procedural sky (replaces clearBackground color)
  BeginShaderMode(skyShader);
  DrawRectangle(0, 0, renderWidth, renderHeight, WHITE);
  EndShaderMode();

  BeginMode3D(camera);
  rlSetClipPlanes(0.1f, 50000.0f);





  if(drawTailOnOff) {
  rlDisableDepthMask();
  BeginBlendMode(BLEND_ADDITIVE);

  for (int i = 0; i < starsObj.pos.size(); i++) {
      int trailSize = starsObj.trail[i].size();
      if (trailSize < 2) continue;

      Vector3 rawColor = starsObj.BlackbodyColorActivation[i] ? starsObj.BBColor[i] : starsObj.ColorNormalized[i];
      Color starBaseColor = Color{
          (unsigned char)Clamp(rawColor.x * 255.0f, 0.0f, 255.0f),
          (unsigned char)Clamp(rawColor.y * 255.0f, 0.0f, 255.0f),
          (unsigned char)Clamp(rawColor.z * 255.0f, 0.0f, 255.0f),
          255
      };

    rlBegin(RL_LINES); //batch raw line drawing
      float currentDist = 0.0f;

      // If trail is huge (infinite mode), render every Nth point to keep 60+ FPS
      int step = (trailSize > Tail_Segments_No_delete) ? (trailSize / Tail_Segments_No_delete) : 1;

      for (int j = step; j < trailSize; j += step) {
          Color segmentColor = starBaseColor;

          // ONLY run expensive sqrt() distance checks if fading tail is enabled
          if (deleteTailBool) {
              currentDist += Vector3Distance(starsObj.trail[i][j - step], starsObj.trail[i][j]);
              float progress = Clamp(currentDist / TARGET_TRAIL_LENGTH, 0.0f, 1.0f); 
              segmentColor = ColorAlpha(starBaseColor, progress * progress * 0.7f);
          }

          rlColor4ub(segmentColor.r, segmentColor.g, segmentColor.b, segmentColor.a);
          rlVertex3f(starsObj.trail[i][j - step].x, starsObj.trail[i][j - step].y, starsObj.trail[i][j - step].z);
          rlVertex3f(starsObj.trail[i][j].x, starsObj.trail[i][j].y, starsObj.trail[i][j].z);
      }
      rlEnd();
      }

      EndBlendMode();
      rlEnableDepthMask();
}

  if (drawGridBool) //a bool for drawings white grid lines
  DrawGrid(64, 500.0f);

  for (int i = 0; i < starsObj.pos.size(); i++) {
    Vector3 bbColor;
    if(starsObj.BlackbodyColorActivation[i])
      bbColor = starsObj.BBColor[i];

      else bbColor = starsObj.ColorNormalized[i];
      
    float luminosity = starsObj.luminosity[i];


    //set photosphere uniforms
    int useBB = (int)starsObj.BlackbodyColorActivation[i];
    SetShaderValue(starShader, starUseBbLoc, &useBB, SHADER_UNIFORM_INT);
    SetShaderValue(starShader, starBbLoc, &bbColor, SHADER_UNIFORM_VEC3);
    SetShaderValue(starShader, starLumiLoc, &luminosity, SHADER_UNIFORM_FLOAT);
    
    starModel.materials[0].shader = starShader;
    DrawModel(starModel, starsObj.pos[i], starsObj.rad[i], WHITE);
  }

  for (int i = 0; i < starsObj.pos.size(); i++) {
    Vector3 bbColor;
    if(starsObj.BlackbodyColorActivation[i])
      bbColor = starsObj.BBColor[i];

      else bbColor = starsObj.ColorNormalized[i];
      
    float luminosity = starsObj.luminosity[i];


    // Set Photosphere Uniforms
    int useBB = (int)starsObj.BlackbodyColorActivation[i];

    // DRAW ADDITIVE CORONA SHELLS
    starModel.materials[0].shader = coronaShader;
    //pass camera position and running time
    SetShaderValue(coronaShader, coronaViewPosLoc, &camera.position, SHADER_UNIFORM_VEC3);
    SetShaderValue(coronaShader, coronaTimeLoc, &ShadertTime, SHADER_UNIFORM_FLOAT);
    SetShaderValue(coronaShader, coronaBbLoc, &bbColor, SHADER_UNIFORM_VEC3);
    SetShaderValue(coronaShader, coronaLumiLoc, &luminosity, SHADER_UNIFORM_FLOAT);

    rlDisableDepthMask();
    BeginBlendMode(BLEND_ADDITIVE);
        float shellScales[3] = { 0.04f, 0.08f, 0.12f };
        for (float scale : shellScales) {
            SetShaderValue(coronaShader, coronaScaleLoc, &scale, SHADER_UNIFORM_FLOAT);
            DrawModelEx(starModel, starsObj.pos[i], {0, 1, 0}, 0.0f, 
                        {starsObj.rad[i], starsObj.rad[i], starsObj.rad[i]}, WHITE);
        }
    EndBlendMode();
    rlEnableDepthMask();

    //draw flames
    starModel.materials[0].shader = flameShaderWide;
    SetShaderValue(flameShaderWide, flameColorLocWide, &bbColor, SHADER_UNIFORM_VEC3);
    SetShaderValue(flameShaderWide, flameLumiLocWide, &luminosity, SHADER_UNIFORM_FLOAT);

    rlDisableDepthMask();
    BeginBlendMode(BLEND_ADDITIVE);
        //render a single smooth atmosphere container (wide)
        float flameContainerScaleWide = 1.18f;
        Vector3 scaleVecWide = { starsObj.rad[i] * flameContainerScaleWide, starsObj.rad[i] * flameContainerScaleWide, starsObj.rad[i] * flameContainerScaleWide };
        DrawModelEx(starModel, starsObj.pos[i], {0, 1, 0}, 0.0f, scaleVecWide, WHITE);
    EndBlendMode();
    rlEnableDepthMask();


    // DRAW VOLUMETRIC FLAMES
    starModel.materials[0].shader = flameShader;
    SetShaderValue(flameShader, flameColorLoc, &bbColor, SHADER_UNIFORM_VEC3);
    SetShaderValue(flameShader, flameLumiLoc, &luminosity, SHADER_UNIFORM_FLOAT);

    rlDisableDepthMask(); 
    BeginBlendMode(BLEND_ADDITIVE);
        //render a single smooth atmosphere container
        float flameContainerScale = 1.06f;
        Vector3 scaleVec = { starsObj.rad[i] * flameContainerScale, starsObj.rad[i] * flameContainerScale, starsObj.rad[i] * flameContainerScale };
        DrawModelEx(starModel, starsObj.pos[i], {0, 1, 0}, 0.0f, scaleVec, WHITE);
    EndBlendMode();
    rlEnableDepthMask();

  }

  EndMode3D();
  EndTextureMode();

  //pass 2: bloom extraction 
BeginTextureMode(bloomPing);
  BeginShaderMode(extractShader);
      DrawTextureRec(hdrTarget.texture, (Rectangle){ 0, 0, (float)hdrTarget.texture.width, (float)-hdrTarget.texture.height }, (Vector2){ 0, 0 }, WHITE);
  EndShaderMode();
EndTextureMode();

//pass 3: gaussian blur (h+v)
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


BeginTextureMode(finalTarget);
    ClearBackground(BLACK);

    rlActiveTextureSlot(1);
    rlEnableTexture(bloomPing.texture.id);

    BeginShaderMode(postShader);
        DrawTextureRec(hdrTarget.texture, (Rectangle){ 0, 0, (float)hdrTarget.texture.width, (float)-hdrTarget.texture.height }, (Vector2){ 0, 0 }, WHITE);
    EndShaderMode();

    rlActiveTextureSlot(1);
    rlDisableTexture();
    rlActiveTextureSlot(0);
    EndTextureMode();

    //frame to FFMPEG
    if (isRecording && ffmpegPipe) {
        Image img = LoadImageFromTexture(finalTarget.texture);
        ImageFlipVertical(&img);
        fwrite(img.data, 1, renderWidth * renderHeight * 4, ffmpegPipe);
        UnloadImage(img);
    }

    BeginDrawing();
        ClearBackground(BLACK);

        //sccale target resolution frame to screen window size
        DrawTexturePro(
            finalTarget.texture,
            (Rectangle){ 0, 0, (float)finalTarget.texture.width, (float)-finalTarget.texture.height },
            (Rectangle){ 0, 0, (float)GetScreenWidth(), (float)GetScreenHeight() },
            (Vector2){ 0, 0 },
            0.0f,
            WHITE
        );

        if(DrawTextInfo) {
        DrawText(TextFormat("RES: %dx%d (F1:2K, F2:1080p, F3:720p, F4:480p) [R:REC, M:SCREENSHOT, T:TIMESTOP]", renderWidth, renderHeight), 10, 10, 20, isRecording ? RED : GREEN);
        DrawFPS(GetScreenWidth() - 100, 10);
        
        }

    EndDrawing();
    }




    if (ffmpegPipe) {
      pclose(ffmpegPipe);
      ffmpegPipe = nullptr;
    }

  UnloadRenderTexture(finalTarget);
  UnloadRenderTexture(hdrTarget);
  UnloadRenderTexture(bloomPing);
  UnloadRenderTexture(bloomPong);

  UnloadMusicStream(spaceSound);
  UnloadSound(impactSound); 
  CloseAudioDevice();
  CloseWindow();
  return 0;
}