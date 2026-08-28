// --- PASS 1: RENDER HDR SCENE ---
BeginTextureMode(hdrTarget);
    ClearBackground(BLACK);

    // 2D Fullscreen Procedural Sky (Replaces ClearBackground color)
    BeginShaderMode(skyShader);
        DrawRectangle(0, 0, screenWidth, screenHeight, WHITE);
    EndShaderMode();

    BeginMode3D(camera);
        
        // YOUR EXISTING STAR LOOP HERE
        for (size_t i = 0; i < stars.size(); i++) {
            
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

    // Draw your UI / ImGui here if you have any
EndDrawing();