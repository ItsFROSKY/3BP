#include "StarLib.h"
#include "raylib.h"
#include "raymath.h"
#include "settings.h"
#include <iostream>
#include "rlgl.h"
#include <filesystem>

#include <cstdio>

#ifdef _WIN32
#define popen _popen
#define pclose _pclose
#endif

FILE* ffmpegPipe = nullptr;

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
Shader coronaShader  = LoadShader("shaders/corona/corona.vert", "shaders/corona/corona.frag");
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

TraceLog(LOG_INFO, "Wide view: %d", flameViewLocWide);
TraceLog(LOG_INFO, "Wide time: %d", flameTimeLocWide);
TraceLog(LOG_INFO, "Wide color: %d", flameColorLocWide);
TraceLog(LOG_INFO, "Wide lumi: %d", flameLumiLocWide);

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

// --- RECORDING & RESOLUTION VARIABLES ---
bool isRecording = false;
int recordFrameCounter = 0;

// Default resolution matches native display size
int renderWidth = screenWidth;
int renderHeight = screenHeight;

// Offscreen target for final post-processed video frame capture
RenderTexture2D finalTarget = LoadRenderTexture(renderWidth, renderHeight);

//HDR and bloom buffers
RenderTexture2D hdrTarget = LoadRenderTexture(renderWidth, renderHeight);
RenderTexture2D bloomPing = LoadRenderTexture(renderWidth, renderHeight);
RenderTexture2D bloomPong = LoadRenderTexture(renderWidth, renderHeight);

SetShaderValue(postShader, GetShaderLocation(postShader, "u_toneMapMode"), &toneMapMode, SHADER_UNIFORM_INT);
SetShaderValue(postShader, GetShaderLocation(postShader, "u_bloomIntensity"), &bloomIntensity, SHADER_UNIFORM_FLOAT);
SetShaderValue(postShader, GetShaderLocation(postShader, "u_exposure"), &exposure, SHADER_UNIFORM_FLOAT);





// Fetch Uniform Locations
int ViewLoc = GetShaderLocation(starShader, "u_viewPos");
int ColorLoc = GetShaderLocation(starShader, "u_starColor");
int timeLoc      = GetShaderLocation(starShader, "u_time");

starModel.materials[0].shader = starShader;

// Helper lambda to resize render targets dynamically on resolution change
auto ResizeRenderTargets = [&](int newW, int newH) {
		renderWidth = newW;
		renderHeight = newH;

		UnloadRenderTexture(hdrTarget);
		UnloadRenderTexture(bloomPing);
		UnloadRenderTexture(bloomPong);
		UnloadRenderTexture(finalTarget);

		hdrTarget = LoadRenderTexture(renderWidth, renderHeight);
		bloomPing = LoadRenderTexture(renderWidth, renderHeight);
		bloomPong = LoadRenderTexture(renderWidth, renderHeight);
		finalTarget = LoadRenderTexture(renderWidth, renderHeight);

		float rW = (float)renderWidth;
		float rH = (float)renderHeight;
		Vector2 resVec = { rW, rH };

		SetShaderValue(blurHShader, GetShaderLocation(blurHShader, "u_renderWidth"), &rW, SHADER_UNIFORM_FLOAT);
		SetShaderValue(blurVShader, GetShaderLocation(blurVShader, "u_renderHeight"), &rH, SHADER_UNIFORM_FLOAT);
		SetShaderValue(skyShader, skyResLoc, &resVec, SHADER_UNIFORM_VEC2);

		TraceLog(LOG_INFO, ">>> RESOLUTION CHANGED TO: %dx%d", renderWidth, renderHeight);
};


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

	// --- RESOLUTION SELECTOR HOTKEYS ---
if (!isRecording) { // Disable resolution switching mid-recording
		if (IsKeyPressed(KEY_F1)) ResizeRenderTargets(GetMonitorWidth(0), GetMonitorHeight(0)); // Native Screen
		if (IsKeyPressed(KEY_F2)) ResizeRenderTargets(3840, 2160);                             // 4K
		if (IsKeyPressed(KEY_F3)) ResizeRenderTargets(2560, 1440);                             // 2K / 1440p
		if (IsKeyPressed(KEY_F4)) ResizeRenderTargets(1920, 1080);                             // 1080p
		if (IsKeyPressed(KEY_F5)) ResizeRenderTargets(1280, 720);                              // 720p
}

// --- RECORDING CONTROLS ---
if (IsKeyPressed(KEY_M)) {
    std::filesystem::create_directories("C:/Frosky/Dev/3BP/Videos_export");
    TakeScreenshot(TextFormat("C:/Frosky/Dev/3BP/Videos_export/screenshot_%d.png", (int)GetTime()));
}

if (IsKeyPressed(KEY_R)) {
    isRecording = !isRecording;
    if (isRecording) {
        std::filesystem::create_directories("C:/Frosky/Dev/3BP/Videos_export");
        
        char cmd[512];
        snprintf(cmd, sizeof(cmd),
            "ffmpeg -y -f rawvideo -vcodec rawvideo -s %dx%d -pix_fmt rgba -r 60 -i - "
            "-c:v libx264 -preset ultrafast -crf 18 -pix_fmt yuv420p C:/Frosky/Dev/3BP/Videos_export/output.mp4",
            renderWidth, renderHeight
        );
        
        ffmpegPipe = popen(cmd, "wb");
        if (!ffmpegPipe) {
            TraceLog(LOG_ERROR, ">>> FAILED TO OPEN FFMPEG PIPE! Ensure FFmpeg is in PATH.");
            isRecording = false;
        } else {
            TraceLog(LOG_INFO, ">>> RECORDING STARTED VIA DIRECT PIPE (%dx%d)...", renderWidth, renderHeight);
        }
    } else {
        if (ffmpegPipe) {
            pclose(ffmpegPipe);
            ffmpegPipe = nullptr;
        }
        TraceLog(LOG_INFO, ">>> RECORDING STOPPED. MP4 SAVED AT C:/Frosky/Dev/3BP/Videos_export/output.mp4");
    }
}



	float time = (float)GetTime();

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

	SetShaderValue(coronaShader, coronaViewPosLoc, &camera.position, SHADER_UNIFORM_VEC3);
	SetShaderValue(coronaShader, coronaTimeLoc, &ShadertTime, SHADER_UNIFORM_FLOAT);

	//set falmes uniforms
	SetShaderValue(flameShader, flameViewLoc, &camera.position, SHADER_UNIFORM_VEC3);
	SetShaderValue(flameShader, flameTimeLoc, &ShadertTime, SHADER_UNIFORM_FLOAT);

	SetShaderValue(flameShaderWide, flameViewLocWide, &camera.position, SHADER_UNIFORM_VEC3);
	SetShaderValue(flameShaderWide, flameTimeLocWide, &ShadertTime, SHADER_UNIFORM_FLOAT);


	// music, to replay music when it stops
	if (!IsMusicStreamPlaying(spaceSound)) {
		PlayMusicStream(spaceSound);
	}


	if (isRecording) {
    // BLENDER OFFLINE MODE: Advance physics by exactly 1/60s per frame
    // No dynamic frame-skipping, zero star jumps, perfect video playback sync.
    RK4(starsObj, (1.0f / RecordFramRate) * simulationRecordSpeed);

    float minRecordDist = deleteTailBool ? 0.05f : 1.0f;
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
	else {
	// fixed-step physics
	physicsTimer += dt_sim;
	while (physicsTimer >= fixedDeltaTime) {
		RK4(starsObj, fixedDeltaTime);
		physicsTimer -= fixedDeltaTime;

		// DISTANCE-BASED TRAIL UPDATE
		// Use 0.5f spacing when trails are infinite, 0.001f when fading
		float minRecordDist = deleteTailBool ? 0.05f : Trail_update_NoDelete;

		for (int i = 0; i < starsObj.pos.size(); i++) {
				if (starsObj.trail[i].empty() || Vector3Distance(starsObj.trail[i].back(), starsObj.pos[i]) > minRecordDist) {
						starsObj.trail[i].push_back(starsObj.pos[i]);
				}

		// Only truncate the trail if deleteTailBool is active
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
	}}




	// the draw loop
	BeginDrawing();
	BeginTextureMode(hdrTarget);
	ClearBackground(BLACK);

	// 2D Fullscreen Procedural Sky (Replaces ClearBackground color)
	BeginShaderMode(skyShader);
	DrawRectangle(0, 0, renderWidth, renderHeight, WHITE);

	EndShaderMode();

	BeginMode3D(camera);
	rlSetClipPlanes(0.1f, 5000000.0f); //makes stars render even when far

	TraceLog(LOG_INFO, "CLIP TEST: 0.1 -> 5000000");
rlSetClipPlanes(0.1f, 5000000.0f);
BeginMode3D(camera);





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

	 rlBegin(RL_LINES); // Batch raw line drawing
		float currentDist = 0.0f;

		// If trail is huge (infinite mode), render every Nth point to keep 60+ FPS
		//
		int step = (!deleteTailBool && trailSize > Tail_Segments_No_delete) ? (trailSize / Tail_Segments_No_delete) : 1;

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
		SetShaderValue(coronaShader, coronaBbLoc, &bbColor, SHADER_UNIFORM_VEC3);
		SetShaderValue(coronaShader, coronaLumiLoc, &luminosity, SHADER_UNIFORM_FLOAT);

		rlDisableDepthMask();
		BeginBlendMode(BLEND_ADDITIVE);
				float shellScales[3] = { 1.04f, 1.08f, 1.12f};
				for (float scale : shellScales) {
						SetShaderValue(coronaShader, coronaScaleLoc, &scale, SHADER_UNIFORM_FLOAT);
						DrawModelEx(starModel, starsObj.pos[i], {0, 1, 0}, 0.0f, 
												{starsObj.rad[i], starsObj.rad[i], starsObj.rad[i]}, WHITE);
				}
		EndBlendMode();
		rlEnableDepthMask();

		// DRAW VOLUMETRIC FLAMES Wide
		starModel.materials[0].shader = flameShaderWide;
		SetShaderValue(flameShaderWide, flameColorLocWide, &bbColor, SHADER_UNIFORM_VEC3);
		SetShaderValue(flameShaderWide, flameLumiLocWide, &luminosity, SHADER_UNIFORM_FLOAT);

		rlDisableDepthMask();
		BeginBlendMode(BLEND_ADDITIVE);
				// Render a single smooth atmosphere container (1.45x star radius)
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
				// Render a single smooth atmosphere container (1.45x star radius)
				float flameContainerScale = 1.06f;
				Vector3 scaleVec = { starsObj.rad[i] * flameContainerScale, starsObj.rad[i] * flameContainerScale, starsObj.rad[i] * flameContainerScale };
				DrawModelEx(starModel, starsObj.pos[i], {0, 1, 0}, 0.0f, scaleVec, WHITE);
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

// --- PASS 4: COMPOSITE TO OFFSCREEN TARGET ---
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

// --- EXPORT FRAME IF RECORDING ---
if (isRecording && ffmpegPipe) {
    Image img = LoadImageFromTexture(finalTarget.texture);
    ImageFlipVertical(&img);
    
    // Send uncompressed raw pixels straight into FFmpeg pipe
    fwrite(img.data, 1, renderWidth * renderHeight * 4, ffmpegPipe);
    
    UnloadImage(img);
}

// --- FINAL DISPLAY TO WINDOW ---
BeginDrawing();
    ClearBackground(BLACK);
    
    // Scale offscreen composite target cleanly to display window
    DrawTexturePro(
        finalTarget.texture,
        (Rectangle){ 0, 0, (float)finalTarget.texture.width, (float)-finalTarget.texture.height },
        (Rectangle){ 0, 0, (float)GetScreenWidth(), (float)GetScreenHeight() },
        (Vector2){ 0, 0 },
        0.0f,
        WHITE
    );

    DrawText(TextFormat("REC RES: %dx%d (F1:Native, F2:4K, F3:2K, F4:1080p, F5:720p)", renderWidth, renderHeight), 10, 10, 20, isRecording ? RED : GREEN);
    DrawFPS(GetScreenWidth() - 100, 10);
		EndDrawing();

		}

	if (ffmpegPipe) {
    pclose(ffmpegPipe);
    ffmpegPipe = nullptr;
	}

	UnloadRenderTexture(finalTarget);
	UnloadMusicStream(spaceSound);
	UnloadSound(impactSound); 
	CloseAudioDevice();
	CloseWindow();
	return 0;
}