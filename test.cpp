#include "raylib.h"
#include "test.h"


int bro() {
  const int screenWidth = 800;
  const int screenHeight = 600;
  InitWindow(screenWidth, screenHeight, "Raylib basic window");
  SetTargetFPS(60);
  while (!WindowShouldClose()) {
    BeginDrawing();
    ClearBackground(BLACK);
    DrawText("It works!", 20, 20, 20, WHITE);
    EndDrawing();
  }
  CloseWindow();
  return 0;
}