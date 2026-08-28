// shaders/sky_background.frag
#version 330

in vec2 fragTexCoord;
out vec4 outputColor;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec3  u_cameraDir; // Camera forward vector passed from C++

// ============================================================================
// USER CONFIGURABLE SETTINGS & TWEAKS
// ============================================================================

// --- STAR FIELD CONTROLS ---
const float STAR_MAJOR_SCALE        = 50.0;  // Spatial grid density for major stars
const float STAR_MAJOR_DENSITY      = 0.95;  // Spawn threshold (top 5% spawn a star)
const float STAR_MICRO_SCALE        = 120.0; // Spatial grid density for faint micro stars
const float STAR_MICRO_DENSITY      = 0.96;  // Spawn threshold for micro stars
const float STAR_BRIGHTNESS         = 1.5;   // Global light intensity multiplier

// Star Size & Distribution
const float STAR_MIN_SIZE           = 0.05;  // Minimum dot radius factor
const float STAR_MAX_SIZE           = 0.35;  // Maximum dot radius factor
const float STAR_SIZE_BIAS          = 3.0;   // Size distribution curve (higher = mostly tiny stars)

// Star Twinkle Controls (Asynchronous)
const float STAR_TWINKLE_AMPLITUDE  = 0.20;  // Maximum glow fluctuation
const float STAR_TWINKLE_SPEED      = 1.3;   // Shimmer speed multiplier

// --- DEEP SPACE NEBULA & VIVID CYAN GAS CONTROLS ---
const float NEBULA_BRIGHTNESS       = 1.85;  // High brightness for prominent gas clouds
const float NEBULA_SCALE            = 1.8;   // Detail scale of gas noise
const float NEBULA_COVERAGE         = 0.55;  // Sky coverage ratio
const float NEBULA_CUTOFF_LOW       = 0.05;  // Density threshold where gas starts fading in
const float NEBULA_CUTOFF_HIGH      = 0.55;  // Density threshold where gas hits max saturation

// High-Contrast Luminous Cyan & Turquoise Palette
const vec3  COLOR_GAS_PURPLE_DEEP   = vec3(0.12, 0.01, 0.28); // Deep space background violet
const vec3  COLOR_GAS_CYAN_VIVID    = vec3(0.00, 0.62, 0.85); // Vibrant cyan body
const vec3  COLOR_GAS_ELECTRIC_TEAL = vec3(0.15, 0.95, 1.00); // Luminous electric turquoise core

// --- MULTI-GALAXY SPATIAL GRID ---
const float GALAXY_GRID_SCALE       = 2.0;   // Spatial grid dividing sky sphere
const float GALAXY_SPAWN_RATE       = 0.38;  // Probability of spawning a galaxy in a sector
const float GALAXY_BRIGHTNESS       = 1.35;  // Global brightness multiplier for all galaxies

// ============================================================================
// PER-GALAXY TYPE CONFIGURATION (WEIGHTS, SIZES & VISUAL TWEAKS)
// ============================================================================

// TYPE 0: GRAND DESIGN SPIRAL
const float TYPE_SPIRAL_WEIGHT      = 0.30;
const float TYPE_SPIRAL_MIN_SIZE    = 0.06;
const float TYPE_SPIRAL_MAX_SIZE    = 0.22;
const float TYPE_SPIRAL_KNOT_INTENSITY = 1.8;

// TYPE 1: BARRED SPIRAL
const float TYPE_BARRED_WEIGHT      = 0.25;
const float TYPE_BARRED_MIN_SIZE    = 0.08;
const float TYPE_BARRED_MAX_SIZE    = 0.24;
const float TYPE_BARRED_LENGTH      = 0.45;

// TYPE 2: ELLIPTICAL GALAXY
const float TYPE_ELLIPTICAL_WEIGHT  = 0.20;
const float TYPE_ELLIPTICAL_MIN_SIZE= 0.05;
const float TYPE_ELLIPTICAL_MAX_SIZE= 0.20;
const float TYPE_ELLIPTICAL_CORE_GLOW = 4.5;

// TYPE 3: RING / LENTICULAR GALAXY
const float TYPE_RING_WEIGHT        = 0.15;
const float TYPE_RING_MIN_SIZE      = 0.06;
const float TYPE_RING_MAX_SIZE      = 0.19;
const float TYPE_RING_RADIUS        = 0.65;

// TYPE 4: IRREGULAR / DWARF GALAXY
const float TYPE_IRREGULAR_WEIGHT   = 0.10;
const float TYPE_IRREGULAR_MIN_SIZE = 0.04;
const float TYPE_IRREGULAR_MAX_SIZE = 0.15;
const float TYPE_IRREGULAR_CHAOS    = 3.5;

// Global Size Distribution Bias
const float GALAXY_SIZE_BIAS        = 1.8;

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
    for (int i = 0; i < 4; i++) {
        total += amp * noise3D(p);
        p *= 2.02;
        amp *= 0.5;
    }
    return total;
}

// ============================================================================
// VIVID CYAN & TURQUOISE NEBULA ENGINE
// ============================================================================

vec3 computeNebula(vec3 rayDir) {
    vec3 p = rayDir * NEBULA_SCALE + vec3(0.0, u_time * 0.004, 0.0);
    vec3 q = vec3(fbm(p), fbm(p + vec3(5.2, 1.3, 2.8)), fbm(p + vec3(1.7, 9.2, 3.4)));
    float rawNoise = fbm(p + 2.0 * q);
    
    float cloud = rawNoise * 0.5 + 0.5;
    float cutoff = 1.0 - NEBULA_COVERAGE;
    cloud = smoothstep(cutoff, cutoff + (NEBULA_CUTOFF_HIGH - NEBULA_CUTOFF_LOW), cloud);

    if (cloud <= 0.001) return vec3(0.0);

    // High-contrast cyan/teal volumetric gas blend
    vec3 neb = mix(COLOR_GAS_PURPLE_DEEP, COLOR_GAS_CYAN_VIVID, smoothstep(0.0, 0.45, cloud));
    neb = mix(neb, COLOR_GAS_ELECTRIC_TEAL, pow(cloud, 1.6));
    
    return neb * cloud * NEBULA_BRIGHTNESS;
}

// ============================================================================
// SEAMLESS UN-CROPPED GALAXY ENGINE (TYPES 0 - 4)
// ============================================================================

vec3 renderSingleGalaxy(vec3 rayDir, vec3 centerDir, vec3 cellHash) {
    float cosAngle = dot(rayDir, centerDir);
    if (cosAngle <= 0.05) return vec3(0.0); // Hemisphere cull

    vec3 h2 = hash33(cellHash * 17.3 + vec3(1.2, 3.4, 5.6));
    vec3 h3 = hash33(cellHash * 43.1 + vec3(9.1, 2.8, 6.4));

    // 1. Determine Morphotype
    int galaxyType = 0;
    float totalWeight = TYPE_SPIRAL_WEIGHT + TYPE_BARRED_WEIGHT + TYPE_ELLIPTICAL_WEIGHT + TYPE_RING_WEIGHT + TYPE_IRREGULAR_WEIGHT;
    float randVal = h2.x * totalWeight;

    if (randVal < TYPE_SPIRAL_WEIGHT) galaxyType = 0;
    else if (randVal < TYPE_SPIRAL_WEIGHT + TYPE_BARRED_WEIGHT) galaxyType = 1;
    else if (randVal < TYPE_SPIRAL_WEIGHT + TYPE_BARRED_WEIGHT + TYPE_ELLIPTICAL_WEIGHT) galaxyType = 2;
    else if (randVal < TYPE_SPIRAL_WEIGHT + TYPE_BARRED_WEIGHT + TYPE_ELLIPTICAL_WEIGHT + TYPE_RING_WEIGHT) galaxyType = 3;
    else galaxyType = 4;

    // 2. Size Scaling
    float minSize = TYPE_SPIRAL_MIN_SIZE;
    float maxSize = TYPE_SPIRAL_MAX_SIZE;
    if (galaxyType == 1) { minSize = TYPE_BARRED_MIN_SIZE; maxSize = TYPE_BARRED_MAX_SIZE; }
    if (galaxyType == 2) { minSize = TYPE_ELLIPTICAL_MIN_SIZE; maxSize = TYPE_ELLIPTICAL_MAX_SIZE; }
    if (galaxyType == 3) { minSize = TYPE_RING_MIN_SIZE; maxSize = TYPE_RING_MAX_SIZE; }
    if (galaxyType == 4) { minSize = TYPE_IRREGULAR_MIN_SIZE; maxSize = TYPE_IRREGULAR_MAX_SIZE; }

    float sizeInterpolant = pow(cellHash.y, GALAXY_SIZE_BIAS);
    float chosenRadiusScale = mix(minSize, maxSize, sizeInterpolant);

    // 3. Exact Tangent Plane (Gnomonic) Local Projection
    vec3 normDir = normalize(centerDir);
    vec3 arbitraryUp = (abs(normDir.y) > 0.99) ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 gRight = normalize(cross(normDir, arbitraryUp));
    vec3 gUp    = cross(gRight, normDir);

    float rollAngle = h2.y * 6.283185;
    vec3 rotatedRight = gRight * cos(rollAngle) + gUp * sin(rollAngle);
    vec3 rotatedUp    = -gRight * sin(rollAngle) + gUp * cos(rollAngle);

    // Project rayDir onto local galaxy billboard plane
    vec3 projRay = rayDir / cosAngle - normDir;
    vec2 gUV = vec2(dot(projRay, rotatedRight), dot(projRay, rotatedUp)) / chosenRadiusScale;

    // Apply tilt
    float tiltFactor = (galaxyType == 2) ? mix(0.60, 0.95, h2.z) : mix(0.35, 0.85, h2.z);
    gUV.y /= tiltFactor;

    float r = length(gUV);
    
    // Smooth falloff to exactly ZERO at r = 1.0 (eliminates all box cuts)
    float discEdgeMask = smoothstep(1.0, 0.70, r);
    if (discEdgeMask <= 0.0) return vec3(0.0);

    float angle = atan(gUV.y, gUV.x);
    vec3 finalGalaxyColor = vec3(0.0);

    vec3 coreColor = mix(vec3(1.0, 0.92, 0.72), vec3(1.0, 0.60, 0.30), h3.z);
    vec3 armColor  = mix(vec3(0.30, 0.65, 1.00), vec3(0.15, 0.85, 1.00), h3.x);

    // 4. Render Morphotypes
    if (galaxyType == 0) {
        // --- TYPE 0: GRAND DESIGN SPIRAL ---
        float numArms = (h2.z > 0.5) ? 2.0 : 4.0;
        float twistRate = mix(3.0, 5.5, h3.y);
        float armDirection = (h3.x > 0.5) ? 1.0 : -1.0;
        
        float spiral = sin((angle * armDirection) * numArms - log(r + 0.001) * twistRate);
        float coreBulge = exp(-r * 4.5) * 3.8;
        float arms = exp(-r * 2.2) * smoothstep(-0.2, 0.8, spiral);

        float armKnotsNoise = noise3D(vec3(gUV * 12.0, h2.y * 10.0));
        float h2Regions = smoothstep(0.55, 0.85, armKnotsNoise) * arms * TYPE_SPIRAL_KNOT_INTENSITY;
        vec3 knotColor = mix(vec3(0.2, 0.85, 1.0), vec3(1.0, 0.4, 0.75), h3.y);

        float dustNoise = fbm(vec3(gUV * 5.0, h2.x * 20.0));
        float dustLanes = smoothstep(0.42, 0.70, dustNoise) * exp(-r * 2.0) * smoothstep(0.1, 0.5, r);

        finalGalaxyColor = (coreColor * coreBulge + armColor * arms + knotColor * h2Regions);
        finalGalaxyColor *= (1.0 - dustLanes * 0.75);

    } else if (galaxyType == 1) {
        // --- TYPE 1: BARRED SPIRAL ---
        float barWidth = 0.08;
        float barLength = TYPE_BARRED_LENGTH;
        float inBar = smoothstep(barWidth, 0.0, abs(gUV.y)) * smoothstep(barLength, 0.0, abs(gUV.x));
        
        float twistRate = mix(2.5, 4.0, h3.y);
        float spiral = sin(angle * 2.0 - log(r + 0.001) * twistRate);
        float arms = exp(-r * 2.0) * smoothstep(-0.1, 0.8, spiral) * smoothstep(0.2, 0.4, r);
        float coreBulge = exp(-r * 5.0) * 3.0;

        vec3 barColor = mix(coreColor, armColor, 0.3);
        finalGalaxyColor = (coreColor * coreBulge + barColor * inBar * 2.5 + armColor * arms);

    } else if (galaxyType == 2) {
        // --- TYPE 2: ELLIPTICAL GALAXY ---
        float ellipticalProfile = exp(-pow(r, 0.6) * TYPE_ELLIPTICAL_CORE_GLOW);
        vec3 deepEllipticalColor = mix(coreColor, vec3(1.0, 0.5, 0.2), 0.2);
        
        finalGalaxyColor = deepEllipticalColor * ellipticalProfile * 4.0;

    } else if (galaxyType == 3) {
        // --- TYPE 3: RING GALAXY ---
        float coreBulge = exp(-r * 7.0) * 4.0;
        float ringDist = abs(r - TYPE_RING_RADIUS);
        float ring = smoothstep(0.12, 0.0, ringDist) * 1.5;
        
        float ringTexture = noise3D(vec3(gUV * 15.0, cellHash.x));
        ring *= (0.7 + 0.6 * ringTexture);

        finalGalaxyColor = (coreColor * coreBulge + armColor * ring);

    } else if (galaxyType == 4) {
        // --- TYPE 4: IRREGULAR / DWARF ---
        vec3 distortedUV = vec3(gUV * 3.0, h2.y * 5.0);
        float chaoticNoise = fbm(distortedUV + vec3(fbm(distortedUV * TYPE_IRREGULAR_CHAOS)));
        
        float clumpiness = smoothstep(0.0, 0.6, chaoticNoise) * exp(-r * 2.5);
        vec3 irregularColor = mix(armColor, vec3(0.6, 0.9, 1.0), chaoticNoise);
        
        finalGalaxyColor = irregularColor * clumpiness * 2.2;
    }

    float distanceDimming = mix(0.40, 1.0, sizeInterpolant);
    return finalGalaxyColor * discEdgeMask * distanceDimming * GALAXY_BRIGHTNESS;
}

// ============================================================================
// DENSE MULTI-GALAXY SPATIAL SECTORING ENGINE
// ============================================================================

vec3 computeGalaxies(vec3 rayDir) {
    vec3 galaxyLight = vec3(0.0);
    vec3 cell = floor(rayDir * GALAXY_GRID_SCALE);

    for (int z = -2; z <= 2; z++) {
        for (int y = -2; y <= 2; y++) {
            for (int x = -2; x <= 2; x++) {
                vec3 neighborCell = cell + vec3(float(x), float(y), float(z));
                vec3 cellHash = hash33(neighborCell);

                if (cellHash.x < GALAXY_SPAWN_RATE) {
                    vec3 centerDir = normalize(neighborCell + cellHash - 0.5);
                    
                    // Pre-check set to 0.78 (cos of ~38 deg), safely outside maximum galaxy radius
                    if (dot(rayDir, centerDir) < 0.78) continue;

                    galaxyLight += renderSingleGalaxy(rayDir, centerDir, cellHash);
                }
            }
        }
    }
    return galaxyLight;
}

// ============================================================================
// REALISTIC ASYNCHRONOUS STAR FIELD
// ============================================================================

float starField3D(vec3 rayDir, float scale, float threshold) {
    vec3 p = rayDir * scale;
    vec3 id = floor(p);
    vec3 gv = fract(p) - 0.5;

    float n = hash31(id);
    if (n > threshold) {
        float dist = length(gv);

        float rawSize = (n - threshold) / (1.0 - threshold);
        float biasedSize = mix(STAR_MIN_SIZE, STAR_MAX_SIZE, pow(rawSize, STAR_SIZE_BIAS));

        float starPhase = hash31(id + vec3(7.3, 1.9, 4.1)) * 628.3;
        float starSpeed = mix(0.4, 2.2, hash31(id + vec3(2.1, 8.4, 1.2))) * STAR_TWINKLE_SPEED;
        
        float twinkleSine = sin(u_time * starSpeed + starPhase);
        float twinkle = 1.0 + (twinkleSine * STAR_TWINKLE_AMPLITUDE);

        return smoothstep(biasedSize, 0.0, dist) * twinkle;
    }
    return 0.0;
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

    vec3 color = vec3(0.000);

    // 1. Render Cyan & Turquoise Nebula Gas
    color += computeNebula(rayDir);

    // 2. Render Un-cropped Galaxies
    color += computeGalaxies(rayDir);

    // 3. Render Non-Clipping Star Layers
    float majorStars = starField3D(rayDir, STAR_MAJOR_SCALE, STAR_MAJOR_DENSITY);
    float microStars = starField3D(rayDir + vec3(17.1), STAR_MICRO_SCALE, STAR_MICRO_DENSITY) * 0.5;

    vec3 starRGB = vec3(majorStars + microStars);
    vec3 tintedStars = mix(starRGB * vec3(0.75, 0.88, 1.0), starRGB * vec3(1.0, 0.85, 0.65), hash31(floor(rayDir * STAR_MAJOR_SCALE)));

    color += tintedStars * STAR_BRIGHTNESS;

    outputColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}