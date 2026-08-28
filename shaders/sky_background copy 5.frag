// shaders/sky_background.frag
#version 330

in vec2 fragTexCoord;
out vec4 outputColor;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec3  u_cameraDir;

// ============================================================================
// REALISTIC DEEP SPACE CONFIGURATION
// ============================================================================

// --- COSMIC VOID & DUST CLOUDS ---
const vec3  COLOR_SPACE_VOID        = vec3(0.001, 0.002, 0.005); // Infinite dark void
const vec3  COLOR_DUST_DARK         = vec3(0.025, 0.012, 0.035); // Deep background interstellar dust
const vec3  COLOR_GAS_EMISSION      = vec3(0.080, 0.030, 0.120); // Subdued ionization magenta
const vec3  COLOR_GAS_TEAL          = vec3(0.010, 0.070, 0.100); // Subdued cosmic teal wisps

const float NEBULA_DENSITY          = 0.45;  // Global gas density (lower = more open space)
const float NEBULA_SCALE            = 1.30;  // Volumetric noise scale

// --- DISTANT DEEP-SKY GALAXIES ---
const float GALAXY_GRID_SCALE       = 4.50;  // High grid density for distant distribution
const float GALAXY_SPAWN_RATE       = 0.18;  // Lower spawn rate for realistic scarcity
const float GALAXY_BRIGHTNESS       = 0.85;  // Faint astronomical brightness

// Galaxy Real-World Angular Sizes (Distant Messier Objects)
const float GALAXY_MIN_SIZE         = 0.008; 
const float GALAXY_MAX_SIZE         = 0.035;

// --- DENSE BACKGROUND STAR FIELD ---
const float STAR_MAJOR_SCALE        = 60.0;
const float STAR_MAJOR_DENSITY      = 0.93;
const float STAR_MICRO_SCALE        = 180.0;
const float STAR_MICRO_DENSITY      = 0.94;
const float STAR_BRIGHTNESS         = 1.10;

// ============================================================================
// NOISE & HASH UTILITIES
// ============================================================================

float hash31(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
    p += vec3(127.1, 311.7, 74.7);
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453123);
}

vec3 hashGrad(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return normalize(-1.0 + 2.0 * fract(sin(p) * 43758.5453));
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    return mix(
        mix(mix(dot(hashGrad(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hashGrad(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hashGrad(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hashGrad(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
        mix(mix(dot(hashGrad(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hashGrad(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hashGrad(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hashGrad(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

float fbm(vec3 p) {
    float total = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
        total += amp * noise3D(p);
        p *= 2.03;
        amp *= 0.5;
    }
    return total;
}

// ============================================================================
// INTEGRATED COSMIC DUST & GAS SYSTEM
// ============================================================================

vec3 computeCosmicGas(vec3 rayDir, out float dustExtinction) {
    vec3 p = rayDir * NEBULA_SCALE + vec3(0.0, u_time * 0.0015, 0.0);
    
    // Low-frequency warping for natural fluid structure
    vec3 q = vec3(fbm(p), fbm(p + vec3(3.4, 1.2, 5.1)), fbm(p + vec3(7.1, 4.5, 1.9)));
    float gasDensity = fbm(p + 1.5 * q) * 0.5 + 0.5;
    
    // Attenuate gas so real space void dominates
    gasDensity = smoothstep(1.0 - NEBULA_DENSITY, 0.90, gasDensity);
    
    // Extinction factor for stars (dark dust absorbs light behind it)
    dustExtinction = exp(-gasDensity * 3.0);

    if (gasDensity <= 0.001) return vec3(0.0);

    vec3 gasColor = mix(COLOR_DUST_DARK, COLOR_GAS_EMISSION, smoothstep(0.0, 0.5, gasDensity));
    gasColor = mix(gasColor, COLOR_GAS_TEAL, pow(gasDensity, 2.2));

    return gasColor * gasDensity;
}

// ============================================================================
// REALISTIC DISTANT GALAXY ENGINE
// ============================================================================

vec3 renderSingleGalaxy(vec3 rayDir, vec3 centerDir, vec3 cellHash) {
    float cosAngle = dot(rayDir, centerDir);
    if (cosAngle <= 0.1) return vec3(0.0);

    vec3 h2 = hash33(cellHash * 17.3 + vec3(1.2, 3.4, 5.6));
    vec3 h3 = hash33(cellHash * 43.1 + vec3(9.1, 2.8, 6.4));

    float galaxyRadius = mix(GALAXY_MIN_SIZE, GALAXY_MAX_SIZE, pow(cellHash.y, 2.5));

    vec3 normDir = normalize(centerDir);
    vec3 arbitraryUp = (abs(normDir.y) > 0.99) ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 gRight = normalize(cross(normDir, arbitraryUp));
    vec3 gUp    = cross(gRight, normDir);

    float rollAngle = h2.y * 6.283185;
    vec3 rotatedRight = gRight * cos(rollAngle) + gUp * sin(rollAngle);
    vec3 rotatedUp    = -gRight * sin(rollAngle) + gUp * cos(rollAngle);

    vec3 projRay = rayDir / cosAngle - normDir;
    vec2 gUV = vec2(dot(projRay, rotatedRight), dot(projRay, rotatedUp)) / galaxyRadius;

    gUV.y /= mix(0.25, 0.85, h2.z); // Real perspective inclination tilt
    float r = length(gUV);
    
    // Natural exponential edge falloff (eliminates all geometric cuts)
    float discEdgeMask = exp(-r * r * 4.0);
    if (discEdgeMask <= 0.001) return vec3(0.0);

    float angle = atan(gUV.y, gUV.x);
    
    // Core bulge & spiral arm structure
    float coreBulge = exp(-r * 8.0) * 4.5;
    float numArms   = (h2.z > 0.5) ? 2.0 : 4.0;
    float spiral    = sin(angle * numArms - log(r + 0.001) * 4.0);
    float arms      = exp(-r * 3.0) * smoothstep(-0.4, 0.7, spiral);

    vec3 coreColor = mix(vec3(1.0, 0.85, 0.60), vec3(1.0, 0.70, 0.40), h3.z);
    vec3 armColor  = mix(vec3(0.40, 0.60, 0.85), vec3(0.20, 0.75, 0.95), h3.x);

    vec3 galaxyColor = coreColor * coreBulge + armColor * arms;
    
    return galaxyColor * discEdgeMask * GALAXY_BRIGHTNESS;
}

vec3 computeGalaxies(vec3 rayDir) {
    vec3 galaxyLight = vec3(0.0);
    vec3 cell = floor(rayDir * GALAXY_GRID_SCALE);

    for (int z = -1; z <= 1; z++) {
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec3 neighborCell = cell + vec3(float(x), float(y), float(z));
                vec3 cellHash = hash33(neighborCell);

                if (cellHash.x < GALAXY_SPAWN_RATE) {
                    vec3 centerDir = normalize(neighborCell + cellHash - 0.5);
                    if (dot(rayDir, centerDir) < 0.95) continue;

                    galaxyLight += renderSingleGalaxy(rayDir, centerDir, cellHash);
                }
            }
        }
    }
    return galaxyLight;
}

// ============================================================================
// NATURAL TWINKLE STAR FIELD
// ============================================================================

float starField3D(vec3 rayDir, float scale, float threshold) {
    vec3 p = rayDir * scale;
    vec3 id = floor(p);
    vec3 gv = fract(p) - 0.5;

    float n = hash31(id);
    if (n > threshold) {
        float dist = length(gv);
        float starSize = mix(0.03, 0.25, pow((n - threshold) / (1.0 - threshold), 3.0));

        float starPhase = hash31(id + vec3(7.3, 1.9, 4.1)) * 628.3;
        float twinkle = 1.0 + 0.15 * sin(u_time * 1.5 + starPhase);

        return smoothstep(starSize, 0.0, dist) * twinkle;
    }
    return 0.0;
}

// ============================================================================
// FILMIC ACES TONE MAPPING (PREVENTS WHITE CLIPPING)
// ============================================================================

vec3 toneMapACES(vec3 color) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

void main() {
    vec3 forward = (length(u_cameraDir) < 0.001) ? vec3(0.0, 0.0, -1.0) : normalize(u_cameraDir);
    
    vec3 worldUp = (abs(forward.y) > 0.99) ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 right   = normalize(cross(forward, worldUp));
    vec3 up      = cross(right, forward);

    vec2 screenUV = (gl_FragCoord.xy - 0.5 * u_resolution) / max(u_resolution.y, 1.0);
    vec3 rayDir   = normalize(forward + screenUV.x * right + screenUV.y * up);

    // 1. Base Dark Void
    vec3 sceneColor = COLOR_SPACE_VOID;

    // 2. Compute Volumetric Gas & Dust Extinction
    float dustExtinction = 1.0;
    sceneColor += computeCosmicGas(rayDir, dustExtinction);

    // 3. Compute Deep-Sky Galaxies
    sceneColor += computeGalaxies(rayDir);

    // 4. Compute Star Field (Attenuated by Interstellar Dust)
    float majorStars = starField3D(rayDir, STAR_MAJOR_SCALE, STAR_MAJOR_DENSITY);
    float microStars = starField3D(rayDir + vec3(17.1), STAR_MICRO_SCALE, STAR_MICRO_DENSITY) * 0.4;
    
    vec3 starColor = mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 0.85, 0.7), hash31(floor(rayDir * STAR_MAJOR_SCALE)));
    vec3 stars = (majorStars + microStars) * starColor * STAR_BRIGHTNESS;

    sceneColor += stars * dustExtinction;

    // 5. Apply ACES Filmic Tone Mapping for smooth exposure blending
    sceneColor = toneMapACES(sceneColor);

    outputColor = vec4(sceneColor, 1.0);
}